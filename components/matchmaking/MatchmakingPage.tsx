'use client'

import { useMatchmaking } from '@/hooks/useMatchmaking'
import { MatchmakingQueue } from './MatchmakingQueue'
import { MatchFound } from './MatchFound'
import { QueueStatus } from './QueueStatus'

export function MatchmakingPage() {
  const { 
    session, 
    isInQueue, 
    estimatedWait, 
    matchFound, 
    joinQueue, 
    leaveQueue, 
    isLoading 
  } = useMatchmaking()

  if (!session) {
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
            width: '60px',
            height: '60px',
            margin: '0 auto 20px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '18px' }}>Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Queue Status - Like debug's join/leave */}
        <QueueStatus
          isInQueue={isInQueue}
          onJoin={joinQueue}
          onLeave={leaveQueue}
          isLoading={isLoading}
          displayName={session.display_name}
        />

        {/* Queue Animation - Shows when in queue */}
        {isInQueue && (
          <div style={{ marginTop: '20px' }}>
            <MatchmakingQueue
              estimatedWait={estimatedWait}
              queuePosition={1}
              usersInQueue={2} // You'd get this from your hook
            />
          </div>
        )}

        {/* Match Found Modal - Like debug */}
        {matchFound && (
          <MatchFound
            match={{
              id: matchFound.id,
              partnerName: matchFound.user1_id === session.guest_id 
                ? matchFound.user2_display_name 
                : matchFound.user1_display_name,
              sharedInterests: matchFound.shared_interests
            }}
          />
        )}
      </div>
    </div>
  )
}