'use client'

interface MatchmakingQueueProps {
  estimatedWait: number
  queuePosition?: number
  usersInQueue?: number
}

export function MatchmakingQueue({ 
  estimatedWait, 
  queuePosition = 1, 
  usersInQueue = 1 
}: MatchmakingQueueProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
      borderRadius: 'clamp(12px, 3vw, 16px)',
      padding: 'clamp(24px, 5vw, 32px)',
      boxShadow: '0 10px 30px rgba(124,58,237,0.2)',
      color: '#f0f0f0',
      textAlign: 'center',
      width: '100%',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle overlay pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 30%)',
        pointerEvents: 'none',
      }} />

      {/* Spinning animation */}
      <div style={{
        width: 'min(80px, 20vw)',
        height: 'min(80px, 20vw)',
        margin: '0 auto clamp(16px, 3vw, 20px)',
        border: '4px solid rgba(255,255,255,0.2)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />

      <h3 style={{
        fontSize: 'clamp(20px, 5vw, 24px)',
        fontWeight: 600,
        marginBottom: 'clamp(4px, 2vw, 8px)',
        fontFamily: "'Georgia', serif",
        letterSpacing: '-0.5px',
      }}>
        Finding your match...
      </h3>

      <p style={{
        fontSize: 'clamp(14px, 3.5vw, 16px)',
        opacity: 0.9,
        marginBottom: 'clamp(12px, 3vw, 16px)',
        color: '#e0e0f0',
      }}>
        {usersInQueue} {usersInQueue === 1 ? 'person' : 'people'} in queue
      </p>

      {/* Position indicator */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(4px)',
        borderRadius: 'clamp(16px, 4vw, 20px)',
        padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
        display: 'inline-block',
        marginBottom: 'clamp(12px, 3vw, 16px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ fontSize: 'clamp(13px, 3vw, 14px)', opacity: 0.9 }}>
          Your position: 
        </span>
        <strong style={{ 
          fontSize: 'clamp(16px, 4vw, 18px)', 
          marginLeft: '4px',
          color: '#ffffff',
        }}>
          #{queuePosition}
        </strong>
      </div>

      {/* Wait time */}
      <div style={{
        fontSize: 'clamp(12px, 3vw, 14px)',
        opacity: 0.8,
        marginBottom: 'clamp(4px, 1.5vw, 8px)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        Estimated wait
      </div>
      <div style={{
        fontSize: 'clamp(28px, 8vw, 32px)',
        fontWeight: 'bold',
        lineHeight: 1.2,
        fontFamily: "'Georgia', serif",
      }}>
        {estimatedWait}s
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
          div { 
            border-radius: 12px !important;
          }
        }
      `}</style>
    </div>
  )
}