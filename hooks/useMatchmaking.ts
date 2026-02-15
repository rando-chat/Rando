'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useMatchmaking() {
  const [session, setSession] = useState<any>(null)  // Store entire session object
  const [isInQueue, setIsInQueue] = useState(false)
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [matchFound, setMatchFound] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize guest session on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data, error } = await supabase.rpc('create_guest_session', {
          p_ip_address: null,
          p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          p_country_code: null
        })

        if (error) throw error
        if (data && data.length > 0) {
          setSession(data[0])
        }
      } catch (err: any) {
        console.error('Init error:', err)
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

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setTimeout(() => checkForMatch(), 100)
    pollingRef.current = setInterval(checkForMatch, 500)
  }

  const checkForMatch = async () => {
    if (!session) return

    try {
      // 🔥 FIX: Check if user already in an active chat (prevents duplicates)
      const { data: existingChat } = await supabase
        .from('chat_sessions')
        .select('id')
        .or(`user1_id.eq.${session.guest_id},user2_id.eq.${session.guest_id}`)
        .eq('status', 'active')
        .maybeSingle();

      if (existingChat) {
        console.log('⚠️ Already in chat, redirecting...');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setMatchFound(existingChat);
        setIsInQueue(false);
        return;
      }

      // Check for existing session
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

      // Check if in queue
      const { data: myEntry } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('user_id', session.guest_id)
        .is('matched_at', null)
        .maybeSingle()

      const amIInQueue = !!myEntry
      if (amIInQueue !== isInQueue) setIsInQueue(amIInQueue)
      if (!amIInQueue) return

      // Get queue
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      if (!queue || queue.length < 2) {
        setEstimatedWait(prev => Math.max(5, prev - 1))
        return
      }

      // 🔥 FIX: Get the first person in queue that's not you
      // This ensures we always match with the oldest waiting user
      const partner = queue[0].user_id === session.guest_id ? queue[1] : queue[0]
      
      if (!partner) {
        setEstimatedWait(prev => Math.max(5, prev - 1))
        return
      }

      // Create session if I should
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
      console.error('Match error:', err)
    }
  }

  const joinQueue = async () => {
    if (!session) return

    setIsLoading(true)
    setError(null)

    try {
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)

      await supabase.from('matchmaking_queue').insert({
        user_id: session.guest_id,
        display_name: session.display_name,
        is_guest: true,
        tier: 'free',
        interests: [],
        entered_at: new Date().toISOString()
      })

      setIsInQueue(true)
      setEstimatedWait(30)
      startPolling()
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

  return {
    session,  // Return entire session object
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