'use client'

import { useState } from 'react'

interface MessageBubbleProps {
  id: string
  content: string
  senderName: string
  isMe: boolean
  timestamp: string
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  reactions?: Record<string, string[]>
  onReaction?: (emoji: string) => void
  onImageClick?: (url: string) => void
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

export function MessageBubble({
  id,
  content,
  senderName,
  isMe,
  timestamp,
  status = 'sent',
  reactions = {},
  onReaction,
  onImageClick
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false)

  const isImage = content.startsWith('📷 Image:')
  const imageUrl = isImage ? content.replace('📷 Image: ', '') : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        position: 'relative'
      }}
      onMouseEnter={() => !isMe && setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div style={{ maxWidth: '70%' }}>
        {/* Sender name */}
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '2px',
          paddingLeft: '4px'
        }}>
          {isMe ? 'You' : senderName}
        </div>

        {/* Message bubble */}
        <div style={{
          padding: isImage ? '4px' : '12px 16px',
          background: isMe ? '#667eea' : 'white',
          color: isMe ? 'white' : '#1f2937',
          borderRadius: '16px',
          borderBottomRightRadius: isMe ? '4px' : '16px',
          borderBottomLeftRadius: isMe ? '16px' : '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {isImage && imageUrl ? (
            <img
              src={imageUrl}
              alt="Shared"
              style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => onImageClick?.(imageUrl)}
            />
          ) : (
            <div style={{ fontSize: '15px', lineHeight: '1.5' }}>
              {content}
            </div>
          )}

          {/* Timestamp */}
          <div style={{
            fontSize: '10px',
            marginTop: isImage ? '4px' : '8px',
            textAlign: 'right',
            color: isMe ? 'rgba(255,255,255,0.7)' : '#9ca3af'
          }}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactions).length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            {Object.entries(reactions).map(([emoji, users]) => (
              <div key={emoji} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2px 6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {emoji} {users.length > 1 && <span>{users.length}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Status for own messages */}
        {isMe && (
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
            {status === 'sending' && '⏳'}
            {status === 'sent' && '✓'}
            {status === 'delivered' && '✓✓'}
            {status === 'read' && '👁️'}
          </div>
        )}
      </div>

      {/* Reaction picker */}
      {showReactions && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: 0,
          background: 'white',
          borderRadius: '20px',
          padding: '4px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          gap: '2px'
        }}>
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                onReaction?.(emoji)
                setShowReactions(false)
              }}
              style={{
                border: 'none',
                background: 'transparent',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}