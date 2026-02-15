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
  
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load guest session (same as debug)
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

  // Load messages and setup subscription (SAME AS DEBUG)
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

      // Load messages (SAME AS DEBUG)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)

      // Setup subscription (SAME AS DEBUG)
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

    // EXACT same channel setup as debug
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
      .subscribe()
  }

  // Send message (SAME AS DEBUG)
  const sendMessage = async (content: string) => {
    if (!content.trim() || !sessionId || !guestSession) return

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

  // Upload image (EXACT same as debug)
  const uploadImage = async (file: File) => {
    if (!sessionId || !guestSession) return null

    try {
      // Same validation as debug
      if (!file.type.startsWith('image/')) throw new Error('Not an image')
      if (file.size > 5 * 1024 * 1024) throw new Error('File too large')

      // Same filename as debug
      const fileExt = file.name.split('.').pop()
      const fileName = `${guestSession.guest_id}/${sessionId}/${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      // Upload (same as debug)
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get URL (same as debug)
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)

      // Send message (same as debug)
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

  // Simple typing (same as debug)
  const sendTyping = (typing: boolean) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: guestSession?.guest_id, isTyping: typing }
    })
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
    messagesEndRef,
    sendMessage,
    sendTyping,
    endChat,
    uploadImage
  }
}