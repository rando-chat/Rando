'use client'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJIS = [
  '😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯',
  '😢', '😡', '🥰', '🤔', '😎', '🥳', '😇', '🤗',
  '😍', '😘', '😭', '😱', '🤯', '🥺', '😤', '👋',
  '🙏', '💪', '🤞', '✌️', '🤟', '👀', '💀', '👻'
]

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
        onClick={onClose}
      />

      {/* Picker */}
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: '0',
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb',
        marginBottom: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '6px',
        zIndex: 1000,
        maxWidth: '320px'
      }}>
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji)
              onClose()
            }}
            style={{
              width: '36px',
              height: '36px',
              fontSize: '20px',
              border: 'none',
              background: '#f3f4f6',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}