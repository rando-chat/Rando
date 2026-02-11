'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { joinMatchmakingQueue, leaveMatchmakingQueue } from '@/lib/database/queries'
import { useAuth } from '@/components/auth/AuthProvider'

export function useMatchmaking() {
  const { getUserId, isGuest } = useAuth()
  const [isInQueue, setIsInQueue] = useState(false)
  const [queuePosition, setQueuePosition] = useState(0)
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [matchFound, setMatchFound] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const checkForMatch = useCallback(async () => {
    const userId = getUserId()
    if (!userId || !mountedRef.current) return

    try {
      // Check if this user's queue entry got a session_id assigned
      const { data: queueEntry } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('is_guest', isGuest)
        .single()

      if (!queueEntry) {
        // Queue entry gone - either matched or expired
        // Check for a recent chat session
        const { data: session } = await supabase
          .from('chat_sessions')
          .select('*')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (session && mountedRef.current) {
          setMatchFound({
            session_id: session.id,
            match_display_name: 'your match',
            match_user_id: session.user1_id === userId ? session.user2_id : session.user1_id,
          })
          setIsInQueue(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
        return
      }

      // Still in queue - try to find a match
      const { data: otherUsers } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', userId)
        .eq('status', 'waiting')
        .limit(1)

      if (otherUsers && otherUsers.length > 0 && mountedRef.current) {
        const partner = otherUsers[0]

        // Create a chat session
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: userId,
            user2_id: partner.user_id,
            user1_display_name: queueEntry.display_name || 'Anonymous',
            user2_display_name: partner.display_name || 'Anonymous',
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (!sessionError && session && mountedRef.current) {
          // Remove both from queue
          await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
          await supabase.from('matchmaking_queue').delete().eq('user_id', partner.user_id)

          setMatchFound({
            session_id: session.id,
            match_display_name: partner.display_name || 'Anonymous',
            match_user_id: partner.user_id,
          })
          setIsInQueue(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      } else {
        // Update wait estimate
        if (mountedRef.current) {
          setEstimatedWait(prev => Math.max(5, prev - 3))
          setQueuePosition(Math.floor(Math.random() * 3) + 1)
        }
      }
    } catch (err) {
      console.error('Matchmaking error:', err)
    }
  }, [getUserId, isGuest])

  const joinQueue = async (params: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const userId = getUserId()
      if (!userId) throw new Error('Not authenticated')

      // Clean up any existing queue entry first
      await supabase.from('matchmaking_queue').delete().eq('user_id', userId)

      // Insert fresh queue entry
      const { error: insertError } = await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: userId,
          is_guest: isGuest,
          user_tier: params.tier || 'free',
          interests: params.interests || [],
          status: 'waiting',
          display_name: params.displayName || 'Anonymous',
          joined_at: new Date().toISOString(),
          last_ping: new Date().toISOString(),
        })

      if (insertError) {
        // Fallback to the query function
        await joinMatchmakingQueue(params)
      }

      setIsInQueue(true)
      setEstimatedWait(30)

      // Start polling every 2 seconds
      pollingRef.current = setInterval(checkForMatch, 2000)

      // Also check immediately
      setTimeout(checkForMatch, 500)
    } catch (err: any) {
      setError(err.message || 'Failed to join queue')
      console.error('Join queue error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const leaveQueue = async () => {
    const userId = getUserId()
    if (!userId) return
    if (pollingRef.current) clearInterval(pollingRef.current)
    await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
    setIsInQueue(false)
    setMatchFound(null)
  }

  return {
    isInQueue,
    queuePosition,
    estimatedWait,
    matchFound,
    joinQueue,
    leaveQueue,
    isLoading,
    error,
  }
}