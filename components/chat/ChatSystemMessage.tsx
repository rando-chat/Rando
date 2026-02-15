'use client'

interface ChatSystemMessageProps {
  message: string
}

export function ChatSystemMessage({ message }: ChatSystemMessageProps) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center',
      width: '100%',
      margin: '8px 0'
    }}>
      <div style={{
        background: '#f3f4f6',
        borderRadius: '20px',
        padding: '8px 16px',
        fontSize: '13px',
        color: '#6b7280',
        maxWidth: '80%',
        textAlign: 'center',
        border: '1px dashed #9ca3af'
      }}>
        {message}
      </div>
    </div>
  )
}