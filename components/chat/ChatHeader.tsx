'use client'

import { ChatActions } from './ChatActions'

interface ChatHeaderProps {
  partnerName: string
  isOnline: boolean
  isTyping: boolean
  partnerLeft: boolean
  onOpenSidebar: () => void
  onReport: () => void
  onEndChat: () => void
  onAddFriend?: () => Promise<void>
  onBlock?: () => Promise<void>
  onMute?: () => void
}

export function ChatHeader({
  partnerName,
  isOnline,
  isTyping,
  partnerLeft,
  onOpenSidebar,
  onReport,
  onEndChat,
  onAddFriend,
  onBlock,
  onMute
}: ChatHeaderProps) {
  return (
    <div style={{ 
      padding: '16px 20px', 
      background: 'white', 
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Left side - Partner info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#1f2937', 
            margin: 0 
          }}>
            💬 {partnerName}
          </h1>
          {!partnerLeft && (
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isOnline ? '#10b981' : '#9ca3af',
              animation: isOnline ? 'pulse 2s infinite' : 'none'
            }} />
          )}
        </div>
        
        {/* Typing indicator */}
        {isTyping && !partnerLeft && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
            <span style={{ fontSize: '12px', color: '#667eea' }}>typing</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              <span style={{ animation: 'typing 1s infinite' }}>.</span>
              <span style={{ animation: 'typing 1s infinite 0.2s' }}>.</span>
              <span style={{ animation: 'typing 1s infinite 0.4s' }}>.</span>
            </div>
          </div>
        )}
        {partnerLeft && (
          <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px', display: 'block' }}>
            • Left the chat
          </span>
        )}
      </div>

      {/* Right side - Actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Info button */}
        <button
          onClick={onOpenSidebar}
          style={{
            padding: '8px 12px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>ℹ️</span> Info
        </button>

        {/* Chat Actions Menu */}
        <ChatActions
          onAddFriend={onAddFriend}
          onReport={onReport}
          onBlock={onBlock}
          onMute={onMute}
          isPartnerOnline={isOnline}
          isPartnerLeft={partnerLeft}
        />

        {/* End Chat button */}
        <button
          onClick={onEndChat}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          End Chat
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes typing {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}