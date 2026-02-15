'use client'

interface TypingIndicatorProps {
  names: string[]
  isVisible: boolean
}

export function TypingIndicator({ names, isVisible }: TypingIndicatorProps) {
  if (!isVisible) return null

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
      {names.join(', ')} {names.length === 1 ? 'is' : 'are'} typing...
    </div>
  )
}

const dotStyle = {
  animation: 'bounce 1.4s infinite',
  fontSize: '20px',
  lineHeight: '12px',
}

// Add this to your global styles or component
// @keyframes bounce {
//   0%, 80%, 100% { transform: translateY(0); }
//   40% { transform: translateY(-5px); }
// }