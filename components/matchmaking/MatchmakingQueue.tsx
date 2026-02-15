'use client'

interface MatchmakingQueueProps {
  position?: number
  estimatedWait: number
  usersInQueue?: number
}

export function MatchmakingQueue({ 
  position = 1, 
  estimatedWait, 
  usersInQueue = 1 
}: MatchmakingQueueProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      textAlign: 'center',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      {/* Animation */}
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 20px',
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          border: '6px solid #f3f4f6',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#667eea'
        }}>
          {position}
        </div>
      </div>

      <h3 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: '#1f2937',
        marginBottom: '8px'
      }}>
        Finding your match...
      </h3>

      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '20px'
      }}>
        {usersInQueue} {usersInQueue === 1 ? 'person' : 'people'} in queue
      </p>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '8px',
        background: '#f3f4f6',
        borderRadius: '4px',
        marginBottom: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${Math.min(100, (30 - estimatedWait) / 30 * 100)}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          borderRadius: '4px',
          transition: 'width 1s ease'
        }} />
      </div>

      <p style={{
        fontSize: '14px',
        color: '#667eea',
        fontWeight: 600
      }}>
        ~{estimatedWait}s remaining
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}