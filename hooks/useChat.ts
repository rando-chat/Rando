'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [guestSession, setGuestSession] = useState<any>(null)
  const [partnerName, setPartnerName] = useState('')
  const [partnerLeft, setPartnerLeft] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load guest session
  useEffect(() => {
    const loadGuestSession = async () => {
      try {
        const { data, error } = await supabase.rpc('create_guest_session')
        if (error) throw error
        if (data && data.length > 0) {
          setGuestSession(data[0])
        }
      } catch (err: any) {
        setError(err.message)
      }
    }

    loadGuestSession()
  }, [])

  // Load messages and setup subscription
  useEffect(() => {
    if (!sessionId || !guestSession) return

    const loadMessages = async () => {
      try {
        setLoading(true)
        
        // Get session details first
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError) throw sessionError

        // Set partner name
        if (session.user1_id === guestSession.guest_id) {
          setPartnerName(session.user2_display_name)
        } else {
          setPartnerName(session.user1_display_name)
        }

        // Load messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        if (messagesError) throw messagesError

        setMessages(messagesData || [])

        // Mark messages as read
        const unreadIds = messagesData
          ?.filter(m => m.sender_id !== guestSession.guest_id && !m.read_by_recipient)
          .map(m => m.id) || []

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read_by_recipient: true })
            .in('id', unreadIds)
        }

        // Setup realtime subscription
        setupSubscription(sessionId)

      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [sessionId, guestSession])

  const setupSubscription = (chatSessionId: string) => {
    if (channelRef.current) return

    const channel = supabase.channel(`chat-${chatSessionId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: guestSession?.guest_id }
      }
    })

    channelRef.current = channel

    // Listen for new messages
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${chatSessionId}`
      }, async (payload) => {
        const newMessage = payload.new
        
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })

        // Mark as read if not from self
        if (newMessage.sender_id !== guestSession?.guest_id) {
          await supabase
            .from('messages')
            .update({ read_by_recipient: true })
            .eq('id', newMessage.id)
        }

        // Auto-scroll
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })

    // Listen for typing indicators
    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== guestSession?.guest_id) {
          setIsTyping(payload.isTyping)

          // Clear typing after 3 seconds if no update
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          
          if (payload.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false)
            }, 3000)
          }
        }
      })

    // Listen for chat session updates (partner left)
    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions',
        filter: `id=eq.${chatSessionId}`
      }, (payload) => {
        if (payload.new.status === 'ended') {
          setPartnerLeft(true)
        }
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to chat channel')
      }
    })
  }

  // Generate content hash for messages
  const generateHash = async (text: string): Promise<string | null> => {
    try {
      const msgBuffer = new TextEncoder().encode(text)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      return null
    }
  }

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId || !guestSession || partnerLeft) return false

    setIsSending(true)
    try {
      const contentHash = await generateHash(content)

      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          sender_id: guestSession.guest_id,
          sender_is_guest: true,
          sender_display_name: guestSession.display_name,
          content: content,
          content_hash: contentHash,
          is_safe: true,
          delivered: true,
          created_at: new Date().toISOString()
        })

      if (error) throw error
      return true

    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsSending(false)
    }
  }

  // Send typing indicator
  const sendTyping = (typing: boolean) => {
    if (!channelRef.current || !guestSession) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: guestSession.guest_id,
        isTyping: typing
      }
    })
  }

  // End chat
  const endChat = async () => {
    if (!sessionId) return

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended', 
          ended_at: new Date().toISOString() 
        })
        .eq('id', sessionId)

      if (error) throw error

      setPartnerLeft(true)

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

    } catch (err: any) {
      setError(err.message)
    }
  }

  // UPLOAD IMAGE - EXACT COPY FROM DEBUG PAGE
  const uploadImage = async (file: File) => {
    if (!sessionId || !guestSession) {
      console.log('❌ No session or guest')
      return null
    }

    console.log('📷 Starting upload process...')
    console.log('📷 File:', file.name, file.type, file.size)
    console.log('📷 Session:', sessionId)
    console.log('📷 Guest:', guestSession.guest_id)

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB')
      }

      // Generate unique filename (same as debug)
      const fileExt = file.name.split('.').pop()
      const fileName = `${guestSession.guest_id}/${sessionId}/${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      console.log('📤 Uploading to:', filePath)

      // 1. Upload to Supabase Storage (EXACT same as debug)
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) {
        console.log('❌ Upload error:', uploadError)
        throw uploadError
      }

      console.log('✅ File uploaded to storage')

      // 2. Get public URL (EXACT same as debug)
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)
      
      console.log('🔗 Public URL:', publicUrl)

      // 3. Send message with image URL (EXACT same as debug)
      const messageData = {
        session_id: sessionId,
        sender_id: guestSession.guest_id,
        sender_is_guest: true,
        sender_display_name: guestSession.display_name,
        content: `📷 Image: ${publicUrl}`,
        created_at: new Date().toISOString()
      }

      console.log('📨 Inserting message:', messageData)

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData)

      if (messageError) {
        console.log('❌ Message error:', messageError)
        throw messageError
      }

      console.log('✅ Image message sent successfully')
      return publicUrl

    } catch (err: any) {
      console.log('❌ Upload failed:', err.message)
      setError(err.message)
      return null
    }
  }

  // Add friend
  const addFriend = async () => {
    if (!guestSession || !sessionId) return

    try {
      // Find partner ID
      const partnerMsg = messages.find(m => m.sender_id !== guestSession.guest_id)
      if (!partnerMsg) throw new Error('No partner found')

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: guestSession.guest_id,
          friend_id: partnerMsg.sender_id,
          is_guest: true,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (error) throw error

    } catch (err: any) {
      setError(err.message)
    }
  }

  // Report user
  const reportUser = async (reason: string, category: string) => {
    if (!guestSession || !sessionId) return

    try {
      const partnerMsg = messages.find(m => m.sender_id !== guestSession.guest_id)
      if (!partnerMsg) throw new Error('No partner found')

      const { error } = await supabase.rpc('handle_user_report', {
        p_reporter_id: guestSession.guest_id,
        p_reporter_is_guest: true,
        p_reported_user_id: partnerMsg.sender_id,
        p_reported_user_is_guest: true,
        p_session_id: sessionId,
        p_reason: reason,
        p_category: category,
        p_evidence: { messages: messages.map(m => m.id) }
      })

      if (error) throw error

    } catch (err: any) {
      setError(err.message)
    }
  }

  // Block user
  const blockUser = async () => {
    if (!guestSession || !sessionId) return

    try {
      const partnerMsg = messages.find(m => m.sender_id !== guestSession.guest_id)
      if (!partnerMsg) throw new Error('No partner found')

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: guestSession.guest_id,
          blocked_user_id: partnerMsg.sender_id,
          is_guest: true,
          blocked_at: new Date().toISOString()
        })

      if (error) throw error

      await endChat()

    } catch (err: any) {
      setError(err.message)
    }
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return {
    messages,
    guestSession,
    partnerName,
    partnerLeft,
    isTyping,
    isSending,
    loading,
    error,
    messagesEndRef,
    sendMessage,
    sendTyping,
    endChat,
    uploadImage,
    addFriend,
    reportUser,
    blockUser,
    scrollToBottom
  }
}