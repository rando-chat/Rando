'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useAuth } from '@/components/auth/AuthProvider'

export default function MatchmakingPage() {
  const router = useRouter()
  const { getUserId, dbUser } = useAuth()
  const { isInQueue, estimatedWait, matchFound, joinQueue, leaveQueue, isLoading, error } = useMatchmaking()
  
  const [displayName, setDisplayName] = useState<string>('')
  const [guestId, setGuestId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize guest session on mount
  useEffect(() => {
    const initializeGuest = async () => {
      try {
        const existingUserId = getUserId()
        
        if (existingUserId) {
          // Logged in user
          setGuestId(existingUserId)
          setDisplayName(dbUser?.display_name || 'User')
          setIsInitializing(false)
          return
        }

        // Try to create guest session with RPC
        try {
          const { data: guestSession, error: rpcError } = await supabase
            .rpc('create_guest_session', {
              p_ip_address: null,
              p_user_agent: navigator.userAgent,
              p_country_code: null
            })

          if (rpcError) throw rpcError

          if (guestSession && guestSession.length > 0) {
            const session = guestSession[0]
            setGuestId(session.guest_id)
            setDisplayName(session.display_name)
            console.log('[Matchmaking] Created guest session:', session.display_name)
          }
        } catch (rpcError) {
          // RPC failed, generate UUID directly (fallback)
          console.log('[Matchmaking] RPC failed, using direct UUID generation')
          const uuid = generateUUID()
          setGuestId(uuid)
          setDisplayName('Anonymous')
        }

        setIsInitializing(false)
      } catch (err) {
        console.error('[Matchmaking] Initialization error:', err)
        // Last resort: use UUID
        const uuid = generateUUID()
        setGuestId(uuid)
        setDisplayName('Anonymous')
        setIsInitializing(false)
      }
    }

    initializeGuest()
  }, [getUserId, dbUser])

  // Generate UUID v4
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Handle match found
  useEffect(() => {
    if (matchFound) {
      console.log('[Matchmaking] Navigating to chat:', matchFound.session_id)
      router.push(`/chat/${matchFound.session_id}`)
    }
  }, [matchFound, router])

  const handleStartChatting = async () => {
    if (!guestId) {
      console.error('[Matchmaking] No guest ID available')
      return
    }

    await joinQueue({
      userId: guestId,
      displayName: displayName,
      tier: dbUser?.tier || 'free',
      interests: dbUser?.interests || [],
    })
  }

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
              You'll be matched with a random stranger
            </p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 30 }}>
              Chatting as: <strong style={{ color: '#667eea' }}>{displayName}</strong>
            </p>

            {error && (
              <div style={{
                padding: 12,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                marginBottom: 20,
                color: '#991b1b',
                fontSize: 14
              }}>
                {error}
              </div>
            )}

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
              ~{estimatedWait}s
              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>
                Est. remaining
              </span>
            </div>

            <button
              onClick={leaveQueue}
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