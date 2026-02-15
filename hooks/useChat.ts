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
      }
    }
    loadGuestSession()
  }, [])

  // Load messages and setup subscription
  useEffect(() => {
    if (!sessionId || !guestSession) return

    const loadMessages = async () => {
      // Get session to know partner name
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (session) {
        // Set partner name correctly
        if (session.user1_id === guestSession.guest_id) {
          setPartnerName(session.user2_display_name)
        } else {
          setPartnerName(session.user1_display_name)
        }
      }

      // Load messages
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)

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

    channel.subscribe()
  }

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId || !guestSession || partnerLeft) return

    setIsSending(true)
    await supabase.from('messages').insert({
      session_id: sessionId,
      sender_id: guestSession.guest_id,
      sender_is_guest: true,
      sender_display_name: guestSession.display_name,
      content: content,
      created_at: new Date().toISOString()
    })
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

  // Upload image
  const uploadImage = async (file: File) => {
    if (!sessionId || !guestSession) return null

    try {
      if (!file.type.startsWith('image/')) throw new Error('Not an image')
      if (file.size > 5 * 1024 * 1024) throw new Error('File too large')

      const fileExt = file.name.split('.').pop()
      const fileName = `${guestSession.guest_id}/${sessionId}/${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)

      await supabase.from('messages').insert({
        session_id: sessionId,
        sender_id: guestSession.guest_id,
        sender_is_guest: true,
        sender_display_name: guestSession.display_name,
        content: `📷 Image: ${publicUrl}`,
        created_at: new Date().toISOString()
      })

      return publicUrl
    } catch (err) {
      console.error('Upload failed:', err)
      return null
    }
  }

  // ✅ ADD THIS - Report user function
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

  // ✅ ADD THIS - Add friend function
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

  // ✅ ADD THIS - Block user function
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
    reportUser,    // ✅ NOW INCLUDED
    addFriend,     // ✅ NOW INCLUDED
    blockUser      // ✅ NOW INCLUDED
  }
}