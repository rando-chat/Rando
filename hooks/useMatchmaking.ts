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
  const [queuePosition, setQueuePosition] = useState(1)
  const [usersInQueue, setUsersInQueue] = useState(0)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const forceMatchRef = useRef<boolean>(false)

  // Initialize guest session and start background polling
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if we already have a session in localStorage
        const storedSession = localStorage.getItem('rando-guest-session')
        
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession)
          setSession(parsedSession)
          console.log('📦 Loaded existing session from storage:', parsedSession)
          startBackgroundPolling()
          return
        }

        // Create new session if none exists
        const { data, error } = await supabase.rpc('create_guest_session')
        if (error) throw error
        if (data && data.length > 0) {
          const newSession = data[0]
          setSession(newSession)
          // Store in localStorage
          localStorage.setItem('rando-guest-session', JSON.stringify(newSession))
          console.log('🆕 Created and stored new session:', newSession)
          startBackgroundPolling()
        }
      } catch (err: any) {
        setError(err.message)
      }
    }

    initialize()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      // Don't delete session on unmount - we want to keep it
    }
  }, [])

  // Background polling - checks queue but doesn't auto-join
  const startBackgroundPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    // Poll every 2 seconds for queue stats
    pollingRef.current = setInterval(async () => {
      if (!session) return

      // Just get queue stats, don't match
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      if (queue) {
        setUsersInQueue(queue.length)

        // Find user's position if they're in queue
        const userIndex = queue.findIndex(u => u.user_id === session.guest_id)
        if (userIndex !== -1) {
          setQueuePosition(userIndex + 1)
          setEstimatedWait(Math.max(5, userIndex * 5))
        }
      }
    }, 2000)
  }

  // Force match - same as debug's force check
  const forceMatch = async () => {
    if (!session) {
      setError('No session')
      return
    }

    setIsLoading(true)
    forceMatchRef.current = true

    try {
      // Clean up any old entry
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)

      // Join queue
      const { error } = await supabase.from('matchmaking_queue').insert({
        user_id: session.guest_id,
        display_name: session.display_name,
        is_guest: true,
        tier: 'free',
        interests: [],
        entered_at: new Date().toISOString()
      })

      if (error) throw error

      setIsInQueue(true)

      // Run checkForMatch immediately and aggressively
      await checkForMatch(true) // true = force mode

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      forceMatchRef.current = false
    }
  }

  // Enhanced checkForMatch with force mode
  const checkForMatch = async (isForced = false) => {
    if (!session) return
    if (!isInQueue && !isForced) return

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

      // Get ALL queue entries (with force mode, get more)
      const limit = isForced ? 50 : 20
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })
        .limit(limit)

      if (!queue || queue.length < 2) {
        if (isForced) {
          // If forced and no match, wait a bit and retry
          setTimeout(() => checkForMatch(true), 200)
        }
        return
      }

      // Find partner (not yourself)
      const partner = queue.find(u => u.user_id !== session.guest_id)
      if (!partner) {
        if (isForced) {
          setTimeout(() => checkForMatch(true), 200)
        }
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
      } else if (isForced) {
        // If forced and we're not the creator, wait and retry
        setTimeout(() => checkForMatch(true), 200)
      }
    } catch (err: any) {
      console.error('Check error:', err)
    }
  }

  const joinQueue = async () => {
    if (!session) return
    await forceMatch()
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
    setQueuePosition(1)
    setUsersInQueue(0)

    // Restart background polling
    startBackgroundPolling()
  }

  return {
    session,
    isInQueue,
    estimatedWait,
    matchFound,
    joinQueue,
    forceMatch,
    leaveQueue,
    isLoading,
    error,
    queuePosition,
    usersInQueue,
  }
}