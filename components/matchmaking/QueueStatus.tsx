'use client'

interface QueueStatusProps {
  isInQueue: boolean
  onJoin: () => void
  onLeave: () => void
  isLoading: boolean
  displayName: string
}

export function QueueStatus({
  isInQueue,
  onJoin,
  onLeave,
  isLoading,
  displayName
}: QueueStatusProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      {/* User display (like debug) */}
      <div style={{
        background: '#f3f4f6',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '20px'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '4px'
        }}>
          You are:
        </p>
        <p style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#667eea'
        }}>
          {displayName}
        </p>
      </div>

      {!isInQueue ? (
        <>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '12px'
          }}>
            Ready to Chat?
          </h3>
          
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Click below to find a random stranger
          </p>

          <button
            onClick={onJoin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: isLoading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              fontWeight: 600,
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(102,126,234,0.4)',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'Joining...' : 'Find a Stranger'}
          </button>
        </>
      ) : (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#10b981',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{
              fontSize: '16px',
              color: '#1f2937',
              fontWeight: 500
            }}>
              In Queue
            </span>
          </div>

          <button
            onClick={onLeave}
            style={{
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 500,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
          >
            Leave Queue
          </button>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}