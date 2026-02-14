'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function MatchmakingPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null) // Store ENTIRE session object like debug
  const [isInQueue, setIsInQueue] = useState(false)
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Generate UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Initialize - EXACTLY like debug page
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
          const guestSession = data[0]
          setSession(guestSession) // Store entire object
        } else {
          throw new Error('No guest session')
        }

        setIsInitializing(false)
      } catch (err) {
        console.error('Init error:', err)
        const uuid = generateUUID()
        setSession({
          guest_id: uuid,
          display_name: 'Guest_' + uuid.slice(0, 8)
        })
        setIsInitializing(false)
      }
    }

    initialize()
  }, [])

  // Check for match - EXACTLY like debug page
  const checkForMatch = async () => {
    if (!session) return

    try {
      // Check for existing session FIRST
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
        router.push(`/chat/${existingSession.id}`)
        return
      }

      if (!isInQueue) return

      // Get queue
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      if (!queue || queue.length === 0) return

      const partner = queue.find(u => u.user_id !== session.guest_id)
      if (!partner) return

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
          
          router.push(`/chat/${newSession.id}`)
        }
      }

      setEstimatedWait(prev => Math.max(5, prev - 1))
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

      setIsInQueue(true)
      
      // Start polling - EXACTLY like debug (500ms)
      setTimeout(checkForMatch, 100)
      pollingRef.current = setInterval(checkForMatch, 500)
      
    } catch (err) {
      console.error('Start error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
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

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  if (isInitializing) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            margin: '0 auto 20px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 18 }}>Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'white',
        borderRadius: 20,
        padding: 40,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        {!isInQueue ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>💬</div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 10, color: '#1f2937' }}>
              Start Chatting
            </h1>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 10 }}>
              You will be matched with a random stranger
            </p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 30 }}>
              Chatting as: <strong style={{ color: '#667eea' }}>{session?.display_name || 'Loading...'}</strong>
            </p>

            <button
              onClick={handleStartChatting}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: 18,
                fontWeight: 600,
                color: 'white',
                background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 12,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              {isLoading ? 'Joining...' : 'Start Chatting'}
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 80,
              height: 80,
              margin: '0 auto 24px',
              border: '6px solid #f3f4f6',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>
              Finding your match...
            </h2>
            
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>
              Looking for someone interesting to talk to
            </p>

            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#f3f4f6',
              borderRadius: 20,
              fontSize: 14,
              color: '#667eea',
              fontWeight: 600,
              marginBottom: 24
            }}>
              {estimatedWait}s
              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>
                {' '}Est. remaining
              </span>
            </div>

            <button
              onClick={handleCancel}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                color: '#6b7280',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}