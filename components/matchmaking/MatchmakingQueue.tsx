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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      color: 'white',
      textAlign: 'center'
    }}>
      {/* Spinning animation (same as debug) */}
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 20px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />

      <h3 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '8px'
      }}>
        Finding your match...
      </h3>
      
      <p style={{
        fontSize: '16px',
        opacity: 0.9,
        marginBottom: '16px'
      }}>
        {usersInQueue} {usersInQueue === 1 ? 'person' : 'people'} in queue
      </p>

      {/* Position indicator (like debug) */}
      <div style={{
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '20px',
        padding: '8px 16px',
        display: 'inline-block',
        marginBottom: '16px'
      }}>
        Your position: <strong>#{queuePosition}</strong>
      </div>

      {/* Wait time (like debug) */}
      <div style={{
        fontSize: '14px',
        opacity: 0.8,
        marginBottom: '8px'
      }}>
        Estimated wait:
      </div>
      <div style={{
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '4px'
      }}>
        {estimatedWait}s
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}