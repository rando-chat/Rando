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
    <>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '300px',
        height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        padding: '24px',
        overflowY: 'auto',
        animation: 'slideIn 0.3s ease'
      }}>
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Chat Info</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px', 
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* Partner Info */}
        <div style={{ 
          background: '#f3f4f6', 
          borderRadius: '12px', 
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: '#667eea', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {partnerName.charAt(0).toUpperCase()}
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', margin: 0 }}>{partnerName}</h4>
        </div>

        {/* Stats */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '12px 0',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ color: '#6b7280' }}>Chat Duration</span>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>{chatDuration}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '12px 0',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ color: '#6b7280' }}>Messages</span>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>{messageCount}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onAddFriend}
            style={{
              padding: '12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
          >
            <span>➕</span> Add Friend
          </button>

          <button
            onClick={onReport}
            style={{
              padding: '12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
          >
            <span>⚠️</span> Report User
          </button>

          <button
            onClick={onBlock}
            style={{
              padding: '12px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
          >
            <span>🚫</span> Block User
          </button>
        </div>
      </div>
    </>
  )
}