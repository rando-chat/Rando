'use client'

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  partnerName: string
  chatDuration: string
  messageCount: number
  onReport: () => void
  onBlock: () => void
  onAddFriend: () => void
}

export function ChatSidebar({
  isOpen,
  onClose,
  partnerName,
  chatDuration,
  messageCount,
  onReport,
  onBlock,
  onAddFriend
}: ChatSidebarProps) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(320px, 85vw)',
      background: '#0a0a0f',
      borderLeft: '1px solid rgba(124,58,237,0.2)',
      zIndex: 100,
      padding: '24px 16px',
      overflowY: 'auto',
      animation: 'slideIn 0.3s ease',
      boxShadow: '-5px 0 30px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#f0f0f0',
          fontFamily: "'Georgia', serif",
        }}>
          Chat Info
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            color: '#a0a0b0',
            fontSize: '18px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Partner info */}
      <div style={{
        background: 'rgba(124,58,237,0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          margin: '0 auto 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
        }}>
          {partnerName?.[0]?.toUpperCase()}
        </div>
        <h4 style={{
          fontSize: '18px',
          color: '#f0f0f0',
          marginBottom: '4px',
          fontFamily: "'Georgia', serif",
        }}>
          {partnerName}
        </h4>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', color: '#7c3aed', marginBottom: '4px' }}>⏱️</div>
          <div style={{ fontSize: '12px', color: '#60607a' }}>Duration</div>
          <div style={{ fontSize: '16px', color: '#f0f0f0' }}>{chatDuration}</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', color: '#7c3aed', marginBottom: '4px' }}>💬</div>
          <div style={{ fontSize: '12px', color: '#60607a' }}>Messages</div>
          <div style={{ fontSize: '16px', color: '#f0f0f0' }}>{messageCount}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onAddFriend}
          style={actionButtonStyle}
        >
          ➕ Add Friend
        </button>
        <button
          onClick={onReport}
          style={actionButtonStyle}
        >
          ⚠️ Report User
        </button>
        <button
          onClick={onBlock}
          style={{...actionButtonStyle, color: '#ef4444'}}
        >
          🚫 Block User
        </button>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

const actionButtonStyle = {
  width: '100%',
  padding: '14px',
  background: 'transparent',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '10px',
  color: '#f0f0f0',
  fontSize: '15px',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}