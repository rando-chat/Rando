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
      // First check if we already have an active session (race-condition safe)
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
          match_display_name: existingSession.user1_id === userId
            ? (existingSession.user2_display_name || 'Anonymous')
            : (existingSession.user1_display_name || 'Anonymous'),
          match_user_id: existingSession.user1_id === userId
            ? existingSession.user2_id
            : existingSession.user1_id,
        })
        setIsInQueue(false)
        // Clean up our queue entry
        await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
        return
      }

      // Check we're still in queue
      const { data: myEntry } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!myEntry) return // removed from queue externally

      // Update ping so we don't get stale-purged
      await supabase
        .from('matchmaking_queue')
        .update({ last_ping: new Date().toISOString() })
        .eq('user_id', userId)

      // Find another waiting user (not us)
      // ORDER BY joined_at so oldest waiter gets priority - reduces race window
      const { data: candidates } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', userId)
        .eq('status', 'waiting')
        .order('joined_at', { ascending: true })
        .limit(1)

      if (!candidates || candidates.length === 0) {
        if (mountedRef.current) {
          setEstimatedWait(prev => Math.max(5, prev - 2))
        }
        return
      }

      const partner = candidates[0]

      // RACE CONDITION GUARD: Only the user with the "lower" userId creates the session
      // This ensures exactly one session gets created even if both poll simultaneously
      const shouldCreate = userId < partner.user_id

      if (shouldCreate) {
        // Mark both as 'matched' atomically before creating session
        const { error: updateError } = await supabase
          .from('matchmaking_queue')
          .update({ status: 'matched' })
          .in('user_id', [userId, partner.user_id])
          .eq('status', 'waiting') // Only update if still 'waiting'

        if (updateError) return // Someone else already matched them

        // Create the chat session
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: userId,
            user2_id: partner.user_id,
            user1_display_name: myEntry.display_name || 'Anonymous',
            user2_display_name: partner.display_name || 'Anonymous',
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (sessionError || !session) {
          // Revert status on failure
          await supabase
            .from('matchmaking_queue')
            .update({ status: 'waiting' })
            .in('user_id', [userId, partner.user_id])
          return
        }

        // Clean up queue entries
        await supabase.from('matchmaking_queue').delete().in('user_id', [userId, partner.user_id])

        if (mountedRef.current) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setMatchFound({
            session_id: session.id,
            match_display_name: partner.display_name || 'Anonymous',
            match_user_id: partner.user_id,
          })
          setIsInQueue(false)
        }
      }
      // If shouldCreate=false, the other user will create — we'll pick it up next poll via existingSession check

    } catch (err) {
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

      // Clean up stale entry
      await supabase.from('matchmaking_queue').delete().eq('user_id', userId)

      // Join queue
      const { error: insertError } = await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: userId,
          is_guest: isGuest || !getUserId(),
          user_tier: params.tier || 'free',
          interests: params.interests || [],
          status: 'waiting',
          display_name: params.displayName || 'Anonymous',
          joined_at: new Date().toISOString(),
          last_ping: new Date().toISOString(),
        })

      if (insertError) throw new Error(insertError.message)

      setIsInQueue(true)
      setEstimatedWait(30)

      // Poll every 2s
      pollingRef.current = setInterval(checkForMatch, 2000)
      // Check immediately
      setTimeout(checkForMatch, 300)

    } catch (err: any) {
      setError(err.message || 'Failed to join queue')
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