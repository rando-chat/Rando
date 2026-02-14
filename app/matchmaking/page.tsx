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

  // Generate UUID v4
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Initialize guest session on mount
  useEffect(() => {
    const initializeGuest = async () => {
      try {
        const existingUserId = getUserId()
        
        if (existingUserId) {
          // Logged in user - extract display name safely
          const userName = typeof dbUser?.display_name === 'string' ? dbUser.display_name : 'User'
          setGuestId(existingUserId)
          setDisplayName(userName)
          setIsInitializing(false)
          console.log('[Matchmaking] Using logged-in user:', userName)
          return
        }

        // Guest user - create session with RPC
        console.log('[Matchmaking] Creating guest session...')
        const { data: guestSession, error: rpcError } = await supabase
          .rpc('create_guest_session', {
            p_ip_address: null,
            p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            p_country_code: null
          })

        if (rpcError) {
          console.error('[Matchmaking] RPC error:', rpcError)
          throw rpcError
        }

        if (guestSession && guestSession.length > 0) {
          const session = guestSession[0]
          const guestIdStr = String(session.guest_id)
          const displayNameStr = String(session.display_name)
          
          setGuestId(guestIdStr)
          setDisplayName(displayNameStr)
          console.log('[Matchmaking] Guest session created:', displayNameStr)
        } else {
          throw new Error('No guest session returned')
        }

        setIsInitializing(false)
      } catch (err: any) {
        console.error('[Matchmaking] Init error:', err)
        // Fallback to direct UUID
        const uuid = generateUUID()
        setGuestId(uuid)
        setDisplayName('Guest_' + uuid.slice(0, 8))
        setIsInitializing(false)
      }
    }

    initializeGuest()
  }, [getUserId, dbUser])

  // Handle match found - navigate to chat
  useEffect(() => {
    if (matchFound && typeof matchFound.session_id === 'string') {
      console.log('[Matchmaking] Match found! Navigating to:', matchFound.session_id)
      router.push(`/chat/${matchFound.session_id}`)
    }
  }, [matchFound, router])

  const handleStartChatting = async () => {
    if (!guestId) {
      console.error('[Matchmaking] No guest ID available')
      return
    }

    console.log('[Matchmaking] Starting matchmaking for:', displayName)

    const userTier = typeof dbUser?.tier === 'string' ? dbUser.tier : 'free'
    const userInterests = Array.isArray(dbUser?.interests) ? dbUser.interests : []

    await joinQueue({
      userId: guestId,
      displayName: displayName,
      tier: userTier,
      interests: userInterests,
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
              You will be matched with a random stranger
            </p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 30 }}>
              Chatting as: <strong style={{ color: '#667eea' }}>{String(displayName)}</strong>
            </p>

            {error && typeof error === 'string' && (
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
              {String(estimatedWait)}s
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