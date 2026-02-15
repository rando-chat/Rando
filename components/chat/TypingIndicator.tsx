'use client'

interface TypingIndicatorProps {
  names: string[]
  isVisible: boolean
}

export function TypingIndicator({ names, isVisible }: TypingIndicatorProps) {
  if (!isVisible) return null

  const text = names.length === 1 
    ? `${names[0]} is typing...` 
    : 'Multiple people are typing...'

  return (
    <div style={{
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#7c3aed',
      fontSize: 'clamp(12px, 3vw, 13px)',
      fontStyle: 'italic',
    }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <span style={dotStyle}>.</span>
        <span style={{...dotStyle, animationDelay: '0.2s'}}>.</span>
        <span style={{...dotStyle, animationDelay: '0.4s'}}>.</span>
      </div>
      {text}
    </div>
  )
}

const dotStyle = {
  animation: 'bounce 1.4s infinite',
  fontSize: '20px',
  lineHeight: '12px',
}