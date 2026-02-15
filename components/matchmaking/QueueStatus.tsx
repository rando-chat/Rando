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
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(10px)',
      borderRadius: 'clamp(12px, 3vw, 16px)',
      padding: 'clamp(20px, 4vw, 24px)',
      border: '1px solid rgba(255,255,255,0.07)',
      textAlign: 'center',
      width: '100%',
      transition: 'all 0.3s ease',
    }}>
      {/* User display */}
      <div style={{
        background: 'rgba(124,58,237,0.1)',
        borderRadius: 'clamp(8px, 2vw, 12px)',
        padding: 'clamp(10px, 2.5vw, 12px)',
        marginBottom: 'clamp(16px, 4vw, 20px)',
        border: '1px solid rgba(124,58,237,0.2)',
      }}>
        <p style={{
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: '#a0a0b0',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          You are:
        </p>
        <p style={{
          fontSize: 'clamp(16px, 4vw, 18px)',
          fontWeight: 'bold',
          color: '#7c3aed',
          fontFamily: "'Georgia', serif",
        }}>
          {displayName}
        </p>
      </div>

      {!isInQueue ? (
        <>
          <h3 style={{
            fontSize: 'clamp(18px, 4.5vw, 20px)',
            fontWeight: 600,
            color: '#f0f0f0',
            marginBottom: 'clamp(8px, 2vw, 12px)',
            fontFamily: "'Georgia', serif",
          }}>
            Ready to Chat?
          </h3>
          
          <p style={{
            fontSize: 'clamp(13px, 3.2vw, 14px)',
            color: '#a0a0b0',
            marginBottom: 'clamp(20px, 5vw, 24px)',
            fontStyle: 'italic',
          }}>
            Meet someone new in seconds
          </p>

          <button
            onClick={onJoin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 'clamp(14px, 3.5vw, 16px)',
              background: isLoading ? '#4a4a6a' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: 'white',
              border: 'none',
              borderRadius: 'clamp(8px, 2vw, 12px)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: 600,
              fontFamily: "'Georgia', serif",
              boxShadow: isLoading ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {isLoading ? 'Joining...' : 'Find a Stranger →'}
          </button>
        </>
      ) : (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: 'clamp(16px, 4vw, 20px)',
          }}>
            <div style={{
              width: 'clamp(8px, 2vw, 10px)',
              height: 'clamp(8px, 2vw, 10px)',
              background: '#22c55e',
              borderRadius: '50%',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: '#f0f0f0',
              fontWeight: 500,
            }}>
              In Queue
            </span>
          </div>

          <button
            onClick={onLeave}
            style={{
              padding: 'clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 24px)',
              background: 'transparent',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'clamp(6px, 1.5vw, 8px)',
              cursor: 'pointer',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
            }}
          >
            Leave Queue
          </button>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @media (max-width: 480px) {
          button { 
            padding: 16px !important;
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}