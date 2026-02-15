'use client'

interface TypingIndicatorProps {
  names: string[]
  isVisible: boolean
}

export function TypingIndicator({ names, isVisible }: TypingIndicatorProps) {
  if (!isVisible || names.length === 0) return null

  const getText = () => {
    if (names.length === 1) {
      return `${names[0]} is typing`
    }
    if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing`
    }
    return 'Several people are typing'
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontSize: '12px',
      color: '#667eea',
      position: 'absolute',
      bottom: '100%',
      left: '20px',
      marginBottom: '4px'
    }}>
      <div style={{ display: 'flex', gap: '3px' }}>
        <span style={{ 
          width: '4px', 
          height: '4px', 
          background: '#667eea', 
          borderRadius: '50%',
          animation: 'typingBounce 1.4s infinite ease-in-out'
        }} />
        <span style={{ 
          width: '4px', 
          height: '4px', 
          background: '#667eea', 
          borderRadius: '50%',
          animation: 'typingBounce 1.4s infinite ease-in-out 0.2s'
        }} />
        <span style={{ 
          width: '4px', 
          height: '4px', 
          background: '#667eea', 
          borderRadius: '50%',
          animation: 'typingBounce 1.4s infinite ease-in-out 0.4s'
        }} />
      </div>
      <span>{getText()}</span>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}