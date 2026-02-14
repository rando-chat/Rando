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
  const visibilityHandlerRef = useRef<(() => void) | null>(null)
  const onlineHandlerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (pollingRef.current) clearInterval(pollingRef.current)
      
      // Cleanup event listeners
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current)
      }
      if (onlineHandlerRef.current) {
        window.removeEventListener('online', onlineHandlerRef.current)
      }
    }
  }, [])

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // PRO TIP 1: Clean up stale queue entries
  const cleanupStaleQueueEntries = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      await supabase
        .from('matchmaking_queue')
        .delete()
        .lt('entered_at', fiveMinutesAgo)
      
      console.log('[Matchmaking] Cleaned up stale queue entries')
    } catch (err) {
      console.error('[Matchmaking] Cleanup error:', err)
    }
  }

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

      if (existingSession) {
        console.log('[Matchmaking] Found existing session:', existingSession.id)
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
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
        await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
        return
      }

      // Check we're still in queue
      const { data: myEntry } = await supabase
        .from('matchmaking_queue')
        .select('user_id, display_name')
        .eq('user_id', userId)
        .is('matched_at', null)
        .maybeSingle()

      if (!myEntry) {
        console.log('[Matchmaking] Not in queue anymore')
        return
      }

      // Find all candidates in queue
      const { data: allCandidates } = await supabase
        .from('matchmaking_queue')
        .select('user_id, display_name, entered_at')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      console.log('[Matchmaking] Total in queue:', allCandidates?.length || 0)

      const partner = allCandidates?.find(c => c.user_id !== userId)

      if (!partner) {
        if (mountedRef.current) {
          setEstimatedWait(prev => Math.max(5, prev - 2))
        }
        return
      }

      console.log('[Matchmaking] Found partner:', partner.user_id.slice(0, 8))

      // Race condition guard: lower user_id creates session
      const shouldCreate = userId < partner.user_id
      console.log('[Matchmaking] Should I create?', shouldCreate)

      if (shouldCreate) {
        console.log('[Matchmaking] Creating session...')

        // Mark both as matched
        await supabase
          .from('matchmaking_queue')
          .update({ matched_at: new Date().toISOString() })
          .in('user_id', [userId, partner.user_id])
          .is('matched_at', null)

        // Create session
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
          .maybeSingle()

        if (sessionError || !session) {
          console.error('[Matchmaking] Session creation failed:', sessionError)
          // Revert matched status
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
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
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

  // ============================================================================
  // PRO TIP 2: Enterprise-Grade Aggressive Polling
  // ============================================================================
  const startMatchPolling = useCallback(() => {
    console.log('[Matchmaking] Starting aggressive polling...')
    
    // Clear any existing polling first (prevent memory leaks)
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    // Layer 1: Immediate check (100ms - catches instant matches)
    setTimeout(() => {
      if (mountedRef.current) {
        console.log('[Matchmaking] Layer 1: Immediate check')
        checkForMatch()
      }
    }, 100)

    // Layer 2: Aggressive polling (1 second intervals - 2x faster than standard)
    pollingRef.current = setInterval(() => {
      if (mountedRef.current) {
        checkForMatch()
      }
    }, 1000)

    // Layer 3: Visibility API (check when user returns to tab)
    visibilityHandlerRef.current = () => {
      if (document.visibilityState === 'visible' && isInQueue && mountedRef.current) {
        console.log('[Matchmaking] Layer 3: Visibility change - checking')
        checkForMatch()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandlerRef.current)

    // Layer 4: Network status (check when connection resumes)
    onlineHandlerRef.current = () => {
      if (isInQueue && mountedRef.current) {
        console.log('[Matchmaking] Layer 4: Network reconnected - checking')
        checkForMatch()
      }
    }
    window.addEventListener('online', onlineHandlerRef.current)

    console.log('[Matchmaking] All polling layers active')
  }, [checkForMatch, isInQueue])

  const joinQueue = async (params: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // PRO TIP 1: Clean up stale entries before joining
      await cleanupStaleQueueEntries()

      let userId = getUserId()
      
      if (!userId) {
        userId = generateUUID()
        console.log('[Matchmaking] Generated guest UUID:', userId)
      }

      myUserIdRef.current = userId

      // Clean up any existing entry for this user
      await supabase.from('matchmaking_queue').delete().eq('user_id', userId)

      console.log('[Matchmaking] Joining queue...')

      // Insert into queue
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
      
      // PRO TIP 2: Start aggressive multi-layer polling
      startMatchPolling()

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
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    // Remove event listeners
    if (visibilityHandlerRef.current) {
      document.removeEventListener('visibilitychange', visibilityHandlerRef.current)
      visibilityHandlerRef.current = null
    }
    if (onlineHandlerRef.current) {
      window.removeEventListener('online', onlineHandlerRef.current)
      onlineHandlerRef.current = null
    }
    
    if (userId) {
      await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
    }
    
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