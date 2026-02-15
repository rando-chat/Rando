'use client'

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read'
  timestamp?: string
}

export function MessageStatus({ status, timestamp }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return '⏳'
      case 'sent':
        return '✓'
      case 'delivered':
        return '✓✓'
      case 'read':
        return '👁️'
      default:
        return '✓'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'read':
        return '#667eea'
      case 'delivered':
        return '#10b981'
      default:
        return '#9ca3af'
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px',
      fontSize: '11px',
      color: getStatusColor(),
      marginTop: '2px'
    }}>
      <span>{getStatusIcon()}</span>
      {timestamp && (
        <span style={{ color: '#9ca3af' }}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}