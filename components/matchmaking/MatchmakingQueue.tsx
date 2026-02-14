'use client'
import { useEffect, useState } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { QueueStatus } from './QueueStatus'
import { MatchFound } from './MatchFound'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'

export function MatchmakingQueue() {
  const { user, dbUser, isGuest, getUserId, getDisplayName, getUserTier } = useAuth()
  const { isInQueue, queuePosition, estimatedWait, matchFound, joinQueue, leaveQueue, isLoading, error } = useMatchmaking()
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    // Get real queue count
    supabase.from('matchmaking_queue').select('id', { count: 'exact', head: true })
      .then(({ count }) => setOnlineCount(count || 0))
  }, [])

  const handleStart = async () => {
    // The new useMatchmaking hook handles session creation internally
    await joinQueue()
  }

  if (matchFound) {
    return <MatchFound match={matchFound} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
        padding: '48px 40px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
      }}>
        {!isInQueue ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✦</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px' }}>
              Find Someone New
            </h1>
            <p style={{ color: '#6b7280', marginBottom: 8, lineHeight: 1.6 }}>
              Get matched with a random stranger for a real conversation.
              {user && dbUser ? ` Hi, ${getDisplayName()}!` : ' No account needed.'}
            </p>

            {onlineCount > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 20, fontSize: 13, color: '#16a34a',
                marginBottom: 32,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#22c55e', display: 'inline-block',
                }} />
                {onlineCount} in queue right now
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px 16px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 8,
                color: '#ef4444', fontSize: 14, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '18px',
                background: isLoading
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '-0.3px',
              }}
            >
              {isLoading ? 'Joining...' : '🎲 Start Chatting'}
            </button>

            <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
              By chatting you agree to our community guidelines
            </p>
          </>
        ) : (
          <QueueStatus
            position={queuePosition}
            estimatedWait={estimatedWait}
            onLeave={leaveQueue}
          />
        )}
      </div>
    </div>
  )
}