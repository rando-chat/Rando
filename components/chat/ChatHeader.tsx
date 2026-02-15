'use client'

import { useState } from 'react'
import { ChatSidebar } from './ChatSidebar'

interface ChatHeaderProps {
  partnerName: string
  isOnline: boolean
  isTyping: boolean
  partnerLeft: boolean
  chatDuration: string
  messageCount: number
  onReport: () => void
  onBlock: () => void
  onAddFriend: () => void
  onEndChat: () => void
}

export function ChatHeader({
  partnerName,
  isOnline,
  isTyping,
  partnerLeft,
  chatDuration,
  messageCount,
  onReport,
  onBlock,
  onAddFriend,
  onEndChat
}: ChatHeaderProps) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <>
      <div style={{ 
        padding: '16px 20px', 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isOnline ? '#10b981' : '#9ca3af',
                  animation: isOnline ? 'pulse 2s infinite' : 'none'
                }} />
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              {isTyping && !partnerLeft && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '12px', color: '#667eea' }}>typing</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <span style={{ animation: 'typing 1s infinite' }}>.</span>
                    <span style={{ animation: 'typing 1s infinite 0.2s' }}>.</span>
                    <span style={{ animation: 'typing 1s infinite 0.4s' }}>.</span>
                  </div>
                </div>
              )}
              {partnerLeft && (
                <span style={{ fontSize: '12px', color: '#ef4444' }}>• Left the chat</span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowSidebar(true)}
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

            {!partnerLeft && (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  style={{ 
                    padding: '8px', 
                    background: '#f3f4f6', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ⋮
                </button>
                
                {showMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid #e5e7eb',
                    minWidth: '150px',
                    zIndex: 100
                  }}>
                    <button
                      onClick={onReport}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        textAlign: 'left',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#f59e0b'
                      }}
                    >
                      ⚠️ Report
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={onEndChat} 
              style={{ 
                padding: '8px 16px', 
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '14px'
              }}
            >
              End Chat
            </button>
          </div>
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

      <ChatSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        partnerName={partnerName}
        chatDuration={chatDuration}
        messageCount={messageCount}
        onReport={onReport}
        onBlock={onBlock}
        onAddFriend={onAddFriend}
      />
    </>
  )
}