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
      marginBottom: '4px',
    }}>
      <div style={{
        maxWidth: 'min(400px, 70vw)',
        background: isOwn ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.03)',
        color: isOwn ? 'white' : '#f0f0f0',
        padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 14px)',
        borderRadius: 'clamp(12px, 3vw, 16px)',
        borderBottomRightRadius: isOwn ? '4px' : '16px',
        borderBottomLeftRadius: isOwn ? '16px' : '4px',
        border: !isOwn ? '1px solid rgba(124,58,237,0.2)' : 'none',
        position: 'relative',
      }}>
        {!isOwn && (
          <div style={{
            fontSize: 'clamp(11px, 2.8vw, 12px)',
            color: '#7c3aed',
            marginBottom: '4px',
            fontWeight: 500,
          }}>
            {sender}
          </div>
        )}
        
        <div style={{
          fontSize: 'clamp(14px, 3.5vw, 15px)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}>
          {content}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
        }}>
          <span style={{
            fontSize: 'clamp(9px, 2.2vw, 10px)',
            color: isOwn ? 'rgba(255,255,255,0.7)' : '#60607a',
          }}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            <span style={{
              fontSize: 'clamp(10px, 2.5vw, 11px)',
              color: status === 'read' ? '#7c3aed' : '#a0a0b0',
            }}>
              {status === 'sent' && '✓'}
              {status === 'delivered' && '✓✓'}
              {status === 'read' && '✓✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}