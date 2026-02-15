'use client'

interface ChatSystemMessageProps {
  message: string
}

export function ChatSystemMessage({ message }: ChatSystemMessageProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      margin: '8px 0',
    }}>
      <div style={{
        background: 'rgba(124,58,237,0.1)',
        borderRadius: '12px',
        padding: '6px 12px',
        fontSize: '11px',
        color: '#7c3aed',
        border: '1px solid rgba(124,58,237,0.2)',
      }}>
        {message}
      </div>
    </div>
  )
}