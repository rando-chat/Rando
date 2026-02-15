'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useMatchmaking() {
  const [session, setSession] = useState<any>(null)
  const [isInQueue, setIsInQueue] = useState(false)
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [matchFound, setMatchFound] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize guest session
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data, error } = await supabase.rpc('create_guest_session')
        if (error) throw error
        if (data && data.length > 0) {
          setSession(data[0])
        }
      } catch (err: any) {
        setError(err.message)
      }
    }

    initialize()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (session?.guest_id) {
        supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)
      }
    }
  }, [])

  // Generate content hash for messages
  const generateHash = async (text: string) => {
    try {
      const msgBuffer = new TextEncoder().encode(text)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      return null
    }
  }

  const checkForMatch = async () => {
    if (!session) return

    try {
      // ALWAYS check for existing session first
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${session.guest_id},user2_id.eq.${session.guest_id}`)
        .eq('status', 'active')
        .maybeSingle()

      if (existingSession) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setMatchFound(existingSession)
        setIsInQueue(false)
        return
      }

      // Only check queue if we're supposed to be in it
      if (!isInQueue) return

      // Get ALL queue entries
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      if (!queue || queue.length < 2) {
        setEstimatedWait(prev => Math.max(5, prev - 1))
        return
      }

      // Find partner (not yourself)
      const partner = queue.find(u => u.user_id !== session.guest_id)
      if (!partner) {
        setEstimatedWait(prev => Math.max(5, prev - 1))
        return
      }

      // Deterministic tie-breaker
      if (session.guest_id < partner.user_id) {
        await supabase
          .from('matchmaking_queue')
          .update({ matched_at: new Date().toISOString() })
          .in('user_id', [session.guest_id, partner.user_id])

        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: session.guest_id,
            user2_id: partner.user_id,
            user1_display_name: session.display_name,
            user2_display_name: partner.display_name,
            status: 'active',
            shared_interests: [],
            match_score: null,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (newSession) {
          await supabase.from('matchmaking_queue').delete().in('user_id', [session.guest_id, partner.user_id])
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          setMatchFound(newSession)
          setIsInQueue(false)
        }
      } else {
        setEstimatedWait(prev => Math.max(5, prev - 1))
      }
    } catch (err: any) {
      console.error('Check error:', err)
    }
  }

  const joinQueue = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      // Clean up old entry
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)

      // Join queue with all optional fields
      const { error } = await supabase.from('matchmaking_queue').insert({
        user_id: session.guest_id,
        display_name: session.display_name,
        is_guest: true,
        tier: 'free',
        interests: [],
        language_preference: 'en',
        looking_for: ['text'],
        match_preferences: { min_age: 18, max_age: 99 },
        queue_score: 50,
        entered_at: new Date().toISOString(),
        last_ping_at: new Date().toISOString()
      })

      if (error) throw error

      setIsInQueue(true)
      setEstimatedWait(30)

      // Start polling
      if (pollingRef.current) clearInterval(pollingRef.current)
      setTimeout(() => checkForMatch(), 100)
      pollingRef.current = setInterval(checkForMatch, 2000) // 2 seconds for production

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const leaveQueue = async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (session) {
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)
    }
    setIsInQueue(false)
    setEstimatedWait(30)
  }

  // Enhanced send message with all schema fields
  const sendMessage = async (sessionId: string, content: string) => {
    if (!session || !content.trim()) return

    try {
      const contentHash = await generateHash(content)

      const { error } = await supabase.from('messages').insert({
        session_id: sessionId,
        sender_id: session.guest_id,
        sender_is_guest: true,
        sender_display_name: session.display_name,
        content: content,
        content_hash: contentHash,
        is_safe: true, // Will be updated by DB trigger
        delivered: true,
        created_at: new Date().toISOString()
      })

      if (error) throw error
      return true
    } catch (err) {
      console.error('Send message error:', err)
      return false
    }
  }

  // Upload image with proper storage
  const uploadImage = async (file: File, sessionId: string) => {
    if (!session) return null

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.guest_id}/${sessionId}/${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)

      // Send message with image URL
      await sendMessage(sessionId, `📷 Image: ${publicUrl}`)

      return publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      return null
    }
  }

  // Mark messages as read
  const markMessagesAsRead = async (sessionId: string, messageIds: string[]) => {
    if (!session || !messageIds.length) return

    await supabase
      .from('messages')
      .update({ read_by_recipient: true })
      .in('id', messageIds)
      .neq('sender_id', session.guest_id)
  }

  return {
    session,
    isInQueue,
    estimatedWait,
    matchFound,
    joinQueue,
    leaveQueue,
    sendMessage,
    uploadImage,
    markMessagesAsRead,
    isLoading,
    error,
  }
}