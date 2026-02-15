'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useChat(sessionId: string) {
  const [session, setSession] = useState<any>(null)
  const [guestSession, setGuestSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll function
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    const initialize = async () => {
      try {
        // Get chat session
        const { data: chatSession, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError) throw sessionError
        if (!chatSession) throw new Error('Session not found')

        setSession(chatSession)

        // Get/create guest session
        const { data, error: guestError } = await supabase.rpc('create_guest_session')
        if (guestError) throw guestError

        if (data && data.length > 0) {
          setGuestSession(data[0])
        }

        // Load messages
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        if (msgs) {
          setMessages(msgs)
          // Scroll to bottom after loading messages
          scrollToBottom()
        }

        // Subscribe to new messages
        subscribeToMessages()

        setIsLoading(false)
      } catch (err: any) {
        setError(err.message)
        setIsLoading(false)
      }
    }

    initialize()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [sessionId])

  const subscribeToMessages = () => {
    if (channelRef.current) return

    const channel = supabase
      .channel(`chat-${sessionId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const msg = payload.new
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        
        // 🔥 AUTO-SCROLL ON NEW MESSAGE
        scrollToBottom()
      })
      .subscribe()

    channelRef.current = channel
  }

  const sendMessage = async (content: string) => {
    if (!session || !guestSession || !content.trim()) return

    setIsSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        session_id: sessionId,
        sender_id: guestSession.guest_id,
        sender_is_guest: true,
        sender_display_name: guestSession.display_name,
        content,
        created_at: new Date().toISOString()
      })

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsSending(false)
    }
  }

  const endChat = async () => {
    if (!session) return

    try {
      await supabase
        .from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
    } catch (err: any) {
      console.error('End chat error:', err)
    }
  }

  return {
    session,
    guestSession,
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    endChat,
    messagesEndRef, // 👈 Export ref for the component to use
  }
}