'use client'

import { useState } from 'react'

interface ChatActionsProps {
  onAddFriend?: () => Promise<void>
  onReport?: () => void
  onBlock?: () => Promise<void>
  onMute?: () => void
  onClearHistory?: () => Promise<void>
  isPartnerOnline?: boolean
  isPartnerLeft?: boolean
  className?: string
}

export function ChatActions({
  onAddFriend,
  onReport,
  onBlock,
  onMute,
  onClearHistory,
  isPartnerOnline = true,
  isPartnerLeft = false,
  className = ''
}: ChatActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleAction = async (action: string, handler?: () => Promise<void> | void) => {
    if (!handler || isPartnerLeft) return
    
    setIsLoading(action)
    try {
      await handler()
    } catch (error) {
      console.error(`Action ${action} failed:`, error)
    } finally {
      setIsLoading(null)
      setIsOpen(false)
    }
  }

  const buttonStyle = {
    width: '100%',
    padding: '12px 16px',
    textAlign: 'left' as const,
    border: 'none',
    background: 'none',
    cursor: isPartnerLeft ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.2s',
    opacity: isPartnerLeft ? 0.5 : 1
  }

  return (
    <div style={{ position: 'relative', ...(className ? { className } : {}) }}>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPartnerLeft}
        style={{
          padding: '8px 12px',
          background: '#f3f4f6',
          border: 'none',
          borderRadius: '6px',
          cursor: isPartnerLeft ? 'not-allowed' : 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          opacity: isPartnerLeft ? 0.5 : 1
        }}
        aria-label="Chat actions"
      >
        <span>⋯</span>
        {isPartnerOnline && !isPartnerLeft && (
          <span style={{
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            display: 'inline-block'
          }} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            minWidth: '200px',
            zIndex: 999,
            overflow: 'hidden'
          }}>
            {/* Add Friend */}
            {onAddFriend && (
              <button
                onClick={() => handleAction('add', onAddFriend)}
                disabled={!!isLoading || isPartnerLeft}
                style={{
                  ...buttonStyle,
                  color: '#1f2937'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: '18px' }}>➕</span>
                {isLoading === 'add' ? 'Adding...' : 'Add Friend'}
              </button>
            )}

            {/* Mute Notifications */}
            {onMute && (
              <button
                onClick={() => handleAction('mute', onMute)}
                disabled={!!isLoading || isPartnerLeft}
                style={{
                  ...buttonStyle,
                  color: '#1f2937',
                  borderBottom: '1px solid #e5e7eb'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: '18px' }}>🔕</span>
                {isLoading === 'mute' ? 'Muting...' : 'Mute Notifications'}
              </button>
            )}

            {/* Report User */}
            {onReport && (
              <button
                onClick={() => {
                  onReport()
                  setIsOpen(false)
                }}
                disabled={isPartnerLeft}
                style={{
                  ...buttonStyle,
                  color: '#f59e0b'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: '18px' }}>⚠️</span>
                Report User
              </button>
            )}

            {/* Block User */}
            {onBlock && (
              <button
                onClick={() => handleAction('block', onBlock)}
                disabled={!!isLoading || isPartnerLeft}
                style={{
                  ...buttonStyle,
                  color: '#ef4444'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: '18px' }}>🚫</span>
                {isLoading === 'block' ? 'Blocking...' : 'Block User'}
              </button>
            )}

            {/* Clear History (Admin only?) */}
            {onClearHistory && (
              <button
                onClick={() => handleAction('clear', onClearHistory)}
                disabled={!!isLoading || isPartnerLeft}
                style={{
                  ...buttonStyle,
                  color: '#6b7280',
                  borderTop: '1px solid #e5e7eb',
                  fontSize: '13px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: '16px' }}>🗑️</span>
                {isLoading === 'clear' ? 'Clearing...' : 'Clear History'}
              </button>
            )}

            {/* Partner Left Notice */}
            {isPartnerLeft && (
              <div style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'center',
                borderTop: '1px solid #e5e7eb'
              }}>
                ⚠️ Partner left the chat
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}