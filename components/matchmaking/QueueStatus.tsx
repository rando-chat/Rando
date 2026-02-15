'use client'

interface QueueStatusProps {
  isInQueue: boolean
  onJoin: () => void
  onLeave: () => void
  estimatedWait?: number
  queuePosition?: number
}

export function QueueStatus({
  isInQueue,
  onJoin,
  onLeave,
  estimatedWait = 30,
  queuePosition = 1
}: QueueStatusProps) {
  if (isInQueue) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '20px',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '14px',
          opacity: 0.9,
          marginBottom: '8px'
        }}>
          You are in queue
        </div>
        
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '4px'
        }}>
          #{queuePosition}
        </div>
        
        <div style={{
          fontSize: '14px',
          opacity: 0.9,
          marginBottom: '16px'
        }}>
          Est. wait: {estimatedWait}s
        </div>
        
        <button
          onClick={onLeave}
          style={{
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          Leave Queue
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      border: '2px dashed #e5e7eb'
    }}>
      <div style={{
        fontSize: '16px',
        color: '#6b7280',
        marginBottom: '16px'
      }}>
        Not in queue
      </div>
      
      <button
        onClick={onJoin}
        style={{
          padding: '12px 24px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
        }}
      >
        Join Queue
      </button>
    </div>
  )
}