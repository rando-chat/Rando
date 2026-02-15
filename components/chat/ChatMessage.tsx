'use client'

interface ChatMessageProps {
  id: string
  content: string
  sender: string
  timestamp: string
  isOwn: boolean
  status?: 'sent' | 'delivered' | 'read'
  onReact?: (emoji: string) => void
}

export function ChatMessage({
  content,
  sender,
  timestamp,
  isOwn,
  status = 'sent',
  onReact
}: ChatMessageProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '12px'
    }}>
      <div style={{
        maxWidth: '70%',
        background: isOwn ? '#667eea' : 'white',
        color: isOwn ? 'white' : '#1f2937',
        padding: '10px 14px',
        borderRadius: '16px',
        borderBottomRightRadius: isOwn ? '4px' : '16px',
        borderBottomLeftRadius: isOwn ? '16px' : '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
          {sender}
        </div>
        <div style={{ fontSize: '15px' }}>
          {content}
        </div>
        <div style={{
          fontSize: '10px',
          marginTop: '4px',
          textAlign: 'right',
          color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af'
        }}>
          {new Date(timestamp).toLocaleTimeString()}
          {isOwn && status === 'read' && ' ✓✓'}
          {isOwn && status === 'delivered' && ' ✓✓'}
          {isOwn && status === 'sent' && ' ✓'}
        </div>
      </div>
    </div>
  )
}