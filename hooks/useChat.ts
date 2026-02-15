'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useChat(sessionId: string) {
  const [session, setSession] = useState<any>(null)
  const [guestSession, setGuestSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageReactions, setMessageReactions] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll function
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ============================================
  // INITIALIZATION
  // ============================================
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
          
          // Start online status tracking
          trackOnlineStatus(data[0].guest_id)
        }

        // Load messages with reactions
        await loadMessages()

        // Subscribe to realtime updates
        subscribeToMessages()
        subscribeToReactions()
        subscribeToTyping()
        subscribeToOnlineStatus()
        subscribeToNotifications()

        // Mark messages as read
        markMessagesAsRead()

        setIsLoading(false)
      } catch (err: any) {
        setError(err.message)
        setIsLoading(false)
      }
    }

    initialize()

    return () => {
      // Cleanup subscriptions
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [sessionId])

  // ============================================
  // ONLINE STATUS TRACKING
  // ============================================
  const trackOnlineStatus = async (guestId: string) => {
    // Update last_active every 30 seconds
    const interval = setInterval(async () => {
      await supabase
        .from('guest_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', guestId)
    }, 30000)
    
    return () => clearInterval(interval)
  }

  // ============================================
  // LOAD MESSAGES WITH REACTIONS
  // ============================================
  const loadMessages = async () => {
    // Load messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (msgs) {
      setMessages(msgs)
      
      // Load reactions for each message
      const reactionsMap: Record<string, any> = {}
      await Promise.all(msgs.map(async (msg) => {
        const { data } = await supabase
          .rpc('get_message_reactions', { p_message_id: msg.id })
        reactionsMap[msg.id] = data || {}
      }))
      setMessageReactions(reactionsMap)
      
      scrollToBottom()
    }
  }

  // ============================================
  // MARK MESSAGES AS READ
  // ============================================
  const markMessagesAsRead = async () => {
    if (!guestSession) return
    
    await supabase
      .rpc('mark_messages_as_read', {
        p_session_id: sessionId,
        p_user_id: guestSession.guest_id
      })
  }

  // ============================================
  // SUBSCRIBE TO NEW MESSAGES
  // ============================================
  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, async (payload) => {
        const msg = payload.new
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        
        // Load reactions for new message
        const { data } = await supabase
          .rpc('get_message_reactions', { p_message_id: msg.id })
        setMessageReactions(prev => ({ ...prev, [msg.id]: data || {} }))
        
        scrollToBottom()
        markMessagesAsRead()
      })
      .subscribe()

    channelRef.current = channel
  }

  // ============================================
  // SUBSCRIBE TO REACTIONS
  // ============================================
  const subscribeToReactions = () => {
    supabase
      .channel(`reactions-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, async (payload) => {
        // Refresh reactions for affected message
        const messageId = payload.new?.message_id || payload.old?.message_id
        if (messageId) {
          const { data } = await supabase
            .rpc('get_message_reactions', { p_message_id: messageId })
          setMessageReactions(prev => ({ ...prev, [messageId]: data || {} }))
        }
      })
      .subscribe()
  }

  // ============================================
  // SUBSCRIBE TO TYPING INDICATOR
  // ============================================
  const subscribeToTyping = () => {
    supabase
      .channel(`typing-${sessionId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== guestSession?.guest_id) {
          setIsTyping(true)
          setTimeout(() => setIsTyping(false), 3000)
        }
      })
      .subscribe()
  }

  // ============================================
  // SUBSCRIBE TO ONLINE STATUS
  // ============================================
  const subscribeToOnlineStatus = () => {
    if (!session) return
    
    const partnerId = session.user1_id === guestSession?.guest_id 
      ? session.user2_id 
      : session.user1_id

    supabase
      .channel(`online-${partnerId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'guest_sessions',
        filter: `id=eq.${partnerId}`
      }, (payload) => {
        const lastActive = new Date(payload.new.last_active)
        const online = (Date.now() - lastActive.getTime()) < 60000
        setIsOnline(online)
      })
      .subscribe()
  }

  // ============================================
  // SUBSCRIBE TO NOTIFICATIONS
  // ============================================
  const subscribeToNotifications = () => {
    if (!guestSession) return

    supabase
      .channel(`notifications-${guestSession.guest_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${guestSession.guest_id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()
  }

  // ============================================
  // SEND MESSAGE
  // ============================================
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

  // ============================================
  // SEND TYPING INDICATOR
  // ============================================
  const sendTyping = () => {
    if (!guestSession) return

    supabase
      .channel(`typing-${sessionId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: guestSession.guest_id }
      })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 2000)
  }

  // ============================================
  // ADD REACTION
  // ============================================
  const addReaction = async (messageId: string, emoji: string) => {
    if (!guestSession) return

    const { error } = await supabase
      .from('message_reactions')
      .upsert({
        message_id: messageId,
        user_id: guestSession.guest_id,
        reaction: emoji
      })

    if (!error) {
      // Refresh reactions
      const { data } = await supabase
        .rpc('get_message_reactions', { p_message_id: messageId })
      setMessageReactions(prev => ({ ...prev, [messageId]: data || {} }))
    }
  }

  // ============================================
  // REMOVE REACTION
  // ============================================
  const removeReaction = async (messageId: string, emoji: string) => {
    if (!guestSession) return

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', guestSession.guest_id)
      .eq('reaction', emoji)

    if (!error) {
      // Refresh reactions
      const { data } = await supabase
        .rpc('get_message_reactions', { p_message_id: messageId })
      setMessageReactions(prev => ({ ...prev, [messageId]: data || {} }))
    }
  }

  // ============================================
  // ADD FRIEND
  // ============================================
  const addFriend = async () => {
    if (!session || !guestSession) return

    const partnerId = session.user1_id === guestSession.guest_id 
      ? session.user2_id 
      : session.user1_id

    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: guestSession.guest_id,
        friend_id: partnerId,
        status: 'pending'
      })

    return { success: !error, error: error?.message }
  }

  // ============================================
  // REPORT USER
  // ============================================
  const reportUser = async (reason: string) => {
    if (!session || !guestSession || !reason.trim()) return

    const partnerId = session.user1_id === guestSession.guest_id 
      ? session.user2_id 
      : session.user1_id

    const { error } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: guestSession.guest_id,
        reported_user_id: partnerId,
        session_id: sessionId,
        reason,
        status: 'pending'
      })

    return { success: !error, error: error?.message }
  }

  // ============================================
  // BLOCK USER
  // ============================================
  const blockUser = async () => {
    if (!session || !guestSession) return

    const partnerId = session.user1_id === guestSession.guest_id 
      ? session.user2_id 
      : session.user1_id

    const { error } = await supabase
      .from('blocked_users')
      .insert({
        user_id: guestSession.guest_id,
        blocked_user_id: partnerId
      })

    return { success: !error, error: error?.message }
  }

  // ============================================
  // MARK NOTIFICATION AS READ
  // ============================================
  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    setUnreadCount(prev => Math.max(0, prev - 1))
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
  }

  // ============================================
  // MARK ALL NOTIFICATIONS AS READ
  // ============================================
  const markAllNotificationsAsRead = async () => {
    if (!guestSession) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', guestSession.guest_id)
      .eq('is_read', false)

    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  // ============================================
  // END CHAT
  // ============================================
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

  // ============================================
  // GET PARTNER INFO
  // ============================================
  const partnerId = session && guestSession
    ? (session.user1_id === guestSession.guest_id ? session.user2_id : session.user1_id)
    : null
    
  const partnerName = session && guestSession
    ? (session.user1_id === guestSession.guest_id 
        ? (session.user2_display_name || 'Anonymous') 
        : (session.user1_display_name || 'Anonymous'))
    : ''

  // ============================================
  // RETURN ALL HOOK VALUES
  // ============================================
  return {
    // Core
    session,
    guestSession,
    messages,
    messageReactions,
    isLoading,
    isSending,
    error,
    
    // Chat features
    sendMessage,
    sendTyping,
    addReaction,
    removeReaction,
    endChat,
    
    // Social features
    addFriend,
    reportUser,
    blockUser,
    
    // Notifications
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    
    // Status
    isTyping,
    isOnline,
    partnerId,
    partnerName,
    
    // Refs
    messagesEndRef,
  }
}