'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'

export function useMatchmaking() {
  const { getUserId, isGuest } = useAuth()
  const [isInQueue, setIsInQueue] = useState(false)
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [matchFound, setMatchFound] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const myUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const checkForMatch = useCallback(async () => {
    const userId = myUserIdRef.current
    if (!userId || !mountedRef.current) return

    try {
      // Check if we already have an active session
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingSession && mountedRef.current) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        setMatchFound({
          session_id: existingSession.id,
          match_display_name: 'your match',
          match_user_id: existingSession.user1_id === userId 
            ? existingSession.user2_id 
            : existingSession.user1_id,
        })
        setIsInQueue(false)
        await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
        return
      }

      // Check we're still in queue
      const { data: myEntry } = await supabase
        .from('matchmaking_queue')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!myEntry) return

      // Find partner
      const { data: candidates } = await supabase
        .from('matchmaking_queue')
        .select('user_id')
        .neq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!candidates || candidates.length === 0) {
        if (mountedRef.current) {
          setEstimatedWait(prev => Math.max(5, prev - 2))
        }
        return
      }

      const partner = candidates[0]

      // Race condition guard
      const shouldCreate = userId < partner.user_id

      if (shouldCreate) {
        // Create session immediately
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: userId,
            user2_id: partner.user_id,
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle()

        if (sessionError || !session) return

        // Clean up queue
        await supabase.from('matchmaking_queue').delete().in('user_id', [userId, partner.user_id])

        if (mountedRef.current) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setMatchFound({
            session_id: session.id,
            match_display_name: 'Anonymous',
            match_user_id: partner.user_id,
          })
          setIsInQueue(false)
        }
      }
    } catch (err: any) {
      console.error('Matchmaking error:', err)
    }
  }, [])

  const joinQueue = async (params: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const userId = getUserId() || params.userId
      if (!userId) throw new Error('No user ID')

      myUserIdRef.current = userId

      // Clean up
      await supabase.from('matchmaking_queue').delete().eq('user_id', userId)

      // Minimal insert - just user_id
      const { error: insertError } = await supabase
        .from('matchmaking_queue')
        .insert({ user_id: userId })

      if (insertError) throw insertError

      setIsInQueue(true)
      setEstimatedWait(30)
      pollingRef.current = setInterval(checkForMatch, 2000)
      setTimeout(checkForMatch, 300)

    } catch (err: any) {
      setError(err.message || 'Failed to join queue')
      console.error('Join queue error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const leaveQueue = async () => {
    const userId = myUserIdRef.current || getUserId()
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (userId) await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
    setIsInQueue(false)
    setMatchFound(null)
  }

  return {
    isInQueue,
    queuePosition: 1,
    estimatedWait,
    matchFound,
    joinQueue,
    leaveQueue,
    isLoading,
    error,
  }
}