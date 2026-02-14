'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function MatchmakingPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize guest session
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data, error } = await supabase.rpc('create_guest_session', {
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
          p_country_code: null
        })

        if (error) throw error

        if (data && data.length > 0) {
          setSession(data[0])
        }

        setIsInitializing(false)
        startPolling()
      } catch (err) {
        console.error('Init error:', err)
        setIsInitializing(false)
      }
    }

    initialize()

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      // Cleanup queue on exit
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
      // Check for existing session
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${session.guest_id},user2_id.eq.${session.guest_id}`)
        .eq('status', 'active')
        .maybeSingle()

      if (existingSession) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        router.push(`/chat/${existingSession.id}`)
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
      if (amIInQueue !== isWaiting) setIsWaiting(amIInQueue)

      if (!amIInQueue) return

      // Get queue
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      if (!queue || queue.length === 0) return

      if (queue.length === 1) {
        setEstimatedWait(prev => Math.max(5, prev - 1))
        return
      }

      const partner = queue.find(u => u.user_id !== session.guest_id)
      if (!partner) return

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
          if (pollingRef.current) clearInterval(pollingRef.current)
          router.push(`/chat/${newSession.id}`)
        }
      } else {
        setEstimatedWait(prev => Math.max(5, prev - 1))
      }
    } catch (err) {
      console.error('Match check error:', err)
    }
  }

  const handleStartChatting = async () => {
    if (!session) return

    setIsLoading(true)
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

      setIsWaiting(true)
      setEstimatedWait(30)
      setTimeout(() => checkForMatch(), 500)
    } catch (err) {
      console.error('Join error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (session) {
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)
    }
    setIsWaiting(false)
    setEstimatedWait(30)
    startPolling()
  }

  if (isInitializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ width: 60, height: 60, margin: '0 auto 20px', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 18 }}>Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 500, width: '100%', background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {!isWaiting ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 20, textAlign: 'center' }}>💬</div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 10, color: '#1f2937', textAlign: 'center' }}>Ready to Chat</h1>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 10, textAlign: 'center' }}>Click below to find a random stranger</p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 30, textAlign: 'center' }}>You are: <strong style={{ color: '#667eea' }}>{session?.display_name || 'Loading...'}</strong></p>

            <button onClick={handleStartChatting} disabled={isLoading} style={{ width: '100%', padding: '16px 24px', fontSize: 18, fontWeight: 600, color: 'white', background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: 12, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
              {isLoading ? 'Joining...' : 'Find a Stranger'}
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 80, height: 80, margin: '0 auto 24px', border: '6px solid #f3f4f6', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1f2937', textAlign: 'center' }}>Finding your match...</h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 8, textAlign: 'center' }}>Looking for someone interesting to talk to</p>
            <div style={{ display: 'inline-block', padding: '8px 16px', background: '#f3f4f6', borderRadius: 20, fontSize: 14, color: '#667eea', fontWeight: 600, marginBottom: 24, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
              {estimatedWait}s <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>Est. remaining</span>
            </div>
            <button onClick={handleCancel} style={{ padding: '12px 24px', fontSize: 16, fontWeight: 600, color: '#6b7280', background: 'white', border: '2px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s', display: 'block', margin: '0 auto' }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}