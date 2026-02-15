'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [guestSession, setGuestSession] = useState<any>(null)
  const [partnerName, setPartnerName] = useState('')
  const [myName, setMyName] = useState('')
  const [partnerLeft, setPartnerLeft] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load guest session
  useEffect(() => {
    const loadGuestSession = async () => {
      const { data } = await supabase.rpc('create_guest_session')
      if (data && data.length > 0) {
        setGuestSession(data[0])
        setMyName(data[0].display_name)
        console.log('👤 My guest session:', data[0])
      }
    }
    loadGuestSession()
  }, [])

  // Load messages and setup subscription
  useEffect(() => {
    if (!sessionId || !guestSession) return

    const loadMessages = async () => {
      console.log('📊 Loading chat for session:', sessionId)
      console.log('👤 Current user:', guestSession)

      // Get session to know partner name
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('❌ Error loading session:', error)
        return
      }

      console.log('📊 Session data from DB:', session)

      // CRITICAL FIX: Identify who is who
      if (session.user1_id === guestSession.guest_id) {
        // Current user is user1
        setMyName(session.user1_display_name)
        setPartnerName(session.user2_display_name)
        console.log('✅ I am user1:', session.user1_display_name)
        console.log('👥 Partner is user2:', session.user2_display_name)
      } else if (session.user2_id === guestSession.guest_id) {
        // Current user is user2
        setMyName(session.user2_display_name)
        setPartnerName(session.user1_display_name)
        console.log('✅ I am user2:', session.user2_display_name)
        console.log('👥 Partner is user1:', session.user1_display_name)
      } else {
        console.error('❌ Current user not found in session!')
        console.log('Session users:', session.user1_id, session.user2_id)
        console.log('Current user:', guestSession.guest_id)
      }

      // Load messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (messagesData) {
        console.log('📨 Loaded', messagesData.length, 'messages')
        setMessages(messagesData)
      }

      // Setup subscription
      setupSubscription()
    }

    loadMessages()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [sessionId, guestSession])

  const setupSubscription = () => {
    if (channelRef.current || !guestSession) return

    console.log('🔌 Setting up realtime subscription...')

    const channel = supabase.channel(`chat-${sessionId}-${Date.now()}`, {
      config: {
        broadcast: { self: true },
        presence: { key: guestSession.guest_id }
      }
    })

    channelRef.current = channel

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const msg = payload.new
        console.log('📨 Realtime message received:', msg)
        setMessages(prev => [...prev, msg])
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })

    // Listen for typing
    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== guestSession?.guest_id) {
          setIsTyping(payload.isTyping)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          if (payload.isTyping) {
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
          }
        }
      })

    channel.subscribe((status) => {
      console.log('📡 Channel status:', status)
    })
  }

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId || !guestSession || partnerLeft) return

    console.log('📤 Sending message:', content)
    setIsSending(true)
    
    const { error } = await supabase.from('messages').insert({
      session_id: sessionId,
      sender_id: guestSession.guest_id,
      sender_is_guest: true,
      sender_display_name: guestSession.display_name,
      content: content,
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error('❌ Error sending message:', error)
    } else {
      console.log('✅ Message sent')
    }
    
    setIsSending(false)
  }

  // Send typing
  const sendTyping = (typing: boolean) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: guestSession?.guest_id, isTyping: typing }
    })
  }

  // Upload image - WITH EXTENSIVE LOGGING
  const uploadImage = async (file: File) => {
    console.log('📷 ===== IMAGE UPLOAD STARTED =====')
    console.log('📷 File:', file.name)
    console.log('📷 Type:', file.type)
    console.log('📷 Size:', file.size)
    console.log('📷 Session:', sessionId)
    console.log('📷 Guest:', guestSession)

    if (!sessionId || !guestSession) {
      console.log('❌ Missing session or guest')
      return null
    }

    try {
      if (!file.type.startsWith('image/')) {
        console.log('❌ Not an image file')
        throw new Error('Not an image')
      }
      
      if (file.size > 5 * 1024 * 1024) {
        console.log('❌ File too large:', file.size)
        throw new Error('File too large')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${guestSession.guest_id}/${sessionId}/${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      console.log('📤 Uploading to:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) {
        console.log('❌ Upload error:', uploadError)
        throw uploadError
      }

      console.log('✅ File uploaded to storage')

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)
      
      console.log('🔗 Public URL:', publicUrl)

      console.log('📨 Sending image message...')
      const { error: messageError } = await supabase.from('messages').insert({
        session_id: sessionId,
        sender_id: guestSession.guest_id,
        sender_is_guest: true,
        sender_display_name: guestSession.display_name,
        content: `📷 Image: ${publicUrl}`,
        created_at: new Date().toISOString()
      })

      if (messageError) {
        console.log('❌ Message error:', messageError)
        throw messageError
      }

      console.log('✅ Image message sent successfully')
      console.log('📷 ===== IMAGE UPLOAD COMPLETE =====')
      return publicUrl

    } catch (err) {
      console.log('❌ Upload failed:', err)
      return null
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

  // Add friend
  const addFriend = async () => {
    if (!guestSession || !sessionId) return

    try {
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

  // End chat
  const endChat = async () => {
    await supabase
      .from('chat_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', sessionId)
    setPartnerLeft(true)
  }

  return {
    messages,
    guestSession,
    partnerName,
    myName,
    partnerLeft,
    isTyping,
    isSending,
    error,
    messagesEndRef,
    sendMessage,
    sendTyping,
    endChat,
    uploadImage,
    reportUser,
    addFriend,
    blockUser
  }
}