'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMatchmaking } from '@/hooks/useMatchmaking'

export default function MatchmakingPage() {
  const router = useRouter()
  const { 
    session, 
    isInQueue, 
    estimatedWait, 
    matchFound, 
    joinQueue, 
    leaveQueue, 
    isLoading 
  } = useMatchmaking()

  // Navigate when match found
  useEffect(() => {
    if (matchFound?.id) {
      router.push(`/chat/${matchFound.id}`)
    }
  }, [matchFound, router])

  if (!session) {
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
      <div style={{ maxWidth: 500, width: '100%', background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
        {!isInQueue ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>💬</div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 10, color: '#1f2937' }}>Ready to Chat</h1>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 10 }}>Click below to find a random stranger</p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 30 }}>
              You are: <strong style={{ color: '#667eea' }}>{session?.display_name || 'Loading...'}</strong>
            </p>

            <button 
              onClick={joinQueue} 
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
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' 
              }}
            >
              {isLoading ? 'Joining...' : 'Find a Stranger'}
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 80, height: 80, margin: '0 auto 24px', border: '6px solid #f3f4f6', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>Finding your match...</h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>Looking for someone interesting to talk to</p>
            <div style={{ display: 'inline-block', padding: '8px 16px', background: '#f3f4f6', borderRadius: 20, fontSize: 14, color: '#667eea', fontWeight: 600, marginBottom: 24 }}>
              {estimatedWait}s <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>Est. remaining</span>
            </div>
            <button onClick={leaveQueue} style={{ padding: '12px 24px', fontSize: 16, fontWeight: 600, color: '#6b7280', background: 'white', border: '2px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', display: 'block', margin: '0 auto' }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}