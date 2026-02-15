'use client'

import { useMatchmaking } from '@/hooks/useMatchmaking'
import { MatchmakingQueue } from '@/components/matchmaking/MatchmakingQueue'
import { MatchFound } from '@/components/matchmaking/MatchFound'
import { QueueStatus } from '@/components/matchmaking/QueueStatus'

export default function MatchmakingPage() {
  const { 
    session, 
    isInQueue, 
    estimatedWait, 
    matchFound, 
    joinQueue, 
    leaveQueue, 
    isLoading,
    queuePosition,
    usersInQueue
  } = useMatchmaking()

  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background orbs - same as landing page */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '10%', left: '15%',
            width: 'min(600px, 80vw)', height: 'min(600px, 80vw)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            animation: 'float1 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '15%', right: '10%',
            width: 'min(500px, 70vw)', height: 'min(500px, 70vw)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
            animation: 'float2 10s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <style>{`
          @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
          @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        <div style={{ 
          textAlign: 'center', 
          color: '#f0f0f0',
          position: 'relative',
          zIndex: 10,
          padding: '20px',
        }}>
          <div style={{
            width: 'min(60px, 15vw)',
            height: 'min(60px, 15vw)',
            margin: '0 auto 20px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ 
            fontSize: 'clamp(16px, 4vw, 18px)', 
            color: '#a0a0b0',
            fontFamily: "'Georgia', serif",
          }}>
            Initializing...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(16px, 4vw, 24px)',
    }}>
      {/* Background orbs - same as landing page */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 'min(600px, 80vw)', height: 'min(600px, 80vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          animation: 'float1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 'min(500px, 70vw)', height: 'min(500px, 70vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
          animation: 'float2 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
      `}</style>

      <div style={{
        maxWidth: '500px',
        width: '100%',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Queue Status */}
        <QueueStatus
          isInQueue={isInQueue}
          onJoin={joinQueue}
          onLeave={leaveQueue}
          isLoading={isLoading}
          displayName={session.display_name}
        />

        {/* Queue Animation */}
        {isInQueue && (
          <div style={{ 
            marginTop: 'clamp(16px, 4vw, 24px)',
            animation: 'fadeIn 0.5s ease',
          }}>
            <MatchmakingQueue
              estimatedWait={estimatedWait}
              queuePosition={queuePosition}
              usersInQueue={usersInQueue}
            />
          </div>
        )}

        {/* Match Found Modal */}
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}