'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'

export function useMatchmaking() {
  const { getUserId } = useAuth()
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

  const generateGuestUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const checkForMatch = useCallback(async () => {
    const userId = myUserIdRef.current
    if (!userId || !mountedRef.current) return

    try {
      console.log('[Matchmaking] Checking for match, userId:', userId)

      // FIRST: Check if we already got matched (someone else created session)
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingSession) {
        console.log('[Matchmaking] Found existing session:', existingSession.id)
        if (pollingRef.current) clearInterval(pollingRef.current)
        setMatchFound({
          session_id: existingSession.id,
          match_display_name: 'Anonymous',
          match_user_id: existingSession.user1_id === userId 
            ? existingSession.user2_id 
            : existingSession.user1_id,
        })
        setIsInQueue(false)
        await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
        return
      }

      // Check if we're still in queue
      const { data: myEntry } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('user_id', userId)
        .is('matched_at', null)
        .maybeSingle()

      if (!myEntry) {
        console.log('[Matchmaking] Not in queue anymore')
        return
      }

      console.log('[Matchmaking] Still in queue, looking for partner...')

      // Find ANY other person waiting
      const { data: allCandidates } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      console.log('[Matchmaking] Total people in queue:', allCandidates?.length || 0)
      
      if (allCandidates) {
        allCandidates.forEach((c, i) => {
          console.log(`  [${i}] user_id: ${c.user_id} ${c.user_id === userId ? '(ME)' : ''}`)
        })
      }

      // Find partner (not me)
      const partner = allCandidates?.find(c => c.user_id !== userId)

      if (!partner) {
        console.log('[Matchmaking] No partner found yet')
        if (mountedRef.current) {
          setEstimatedWait(prev => Math.max(5, prev - 2))
        }
        return
      }

      console.log('[Matchmaking] Found partner:', partner.user_id)

      // SIMPLE: Always let the first user alphabetically create the session
      const iAmFirst = userId < partner.user_id
      console.log('[Matchmaking] Should I create session?', iAmFirst)

      if (iAmFirst) {
        console.log('[Matchmaking] Creating session...')

        // Mark BOTH as matched FIRST
        const { error: updateError } = await supabase
          .from('matchmaking_queue')
          .update({ matched_at: new Date().toISOString() })
          .in('user_id', [userId, partner.user_id])

        if (updateError) {
          console.error('[Matchmaking] Error updating queue:', updateError)
          return
        }

        // Create chat session
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

        if (sessionError) {
          console.error('[Matchmaking] Error creating session:', sessionError)
          // Revert matched_at
          await supabase
            .from('matchmaking_queue')
            .update({ matched_at: null })
            .in('user_id', [userId, partner.user_id])
          return
        }

        console.log('[Matchmaking] Session created:', session.id)

        // Clean up queue
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
      } else {
        console.log('[Matchmaking] Waiting for partner to create session...')
      }
    } catch (err: any) {
      console.error('[Matchmaking] Error:', err)
    }
  }, [])

  const joinQueue = async (params: any) => {
    setIsLoading(true)
    setError(null)
    try {
      let userId = getUserId()
      
      if (!userId) {
        userId = generateGuestUUID()
        console.log('[Matchmaking] Generated guest UUID:', userId)
      }

      myUserIdRef.current = userId

      // Clean up
      await supabase.from('matchmaking_queue').delete().eq('user_id', userId)

      console.log('[Matchmaking] Joining queue...')

      const { error: insertError } = await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: userId,
          display_name: params.displayName || 'Anonymous',
          is_guest: !getUserId(),
          tier: params.tier || 'free',
          interests: params.interests || [],
          matched_at: null,
          entered_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('[Matchmaking] Insert error:', insertError)
        throw insertError
      }

      console.log('[Matchmaking] Joined queue successfully')

      setIsInQueue(true)
      setEstimatedWait(30)
      pollingRef.current = setInterval(checkForMatch, 2000)
      setTimeout(checkForMatch, 500)

    } catch (err: any) {
      setError(err.message || 'Failed to join queue')
      console.error('[Matchmaking] Join error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const leaveQueue = async () => {
    const userId = myUserIdRef.current || getUserId()
    console.log('[Matchmaking] Leaving queue...')
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