'use client'

import { useState } from 'react'
import { MessageStatus } from './MessageStatus'

interface MessageBubbleProps {
  id: string
  content: string
  senderName: string
  senderId: string
  isMe: boolean
  timestamp: string
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  reactions?: Record<string, string[]>
  onReaction?: (emoji: string) => void
  onImageClick?: (url: string) => void
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡']

export function MessageBubble({
  id,
  content,
  senderName,
  senderId,
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(emoji)
      setShowReactions(false)
    }
  }

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        width: '100%',
        marginBottom: '8px',
        position: 'relative'
      }}
      onMouseEnter={() => !isMe && setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div style={{ maxWidth: '70%', minWidth: '120px' }}>
        {/* Sender Name */}
        <div style={{ 
          fontSize: '12px', 
          color: isMe ? '#667eea' : '#6b7280', 
          marginBottom: '2px', 
          textAlign: isMe ? 'right' : 'left',
          padding: '0 4px'
        }}>
          {isMe ? 'You' : senderName}
        </div>

        {/* Message Bubble */}
        <div 
          style={{ 
            padding: isImage ? '4px' : '12px 16px',
            borderRadius: '16px',
            background: isMe ? '#667eea' : 'white',
            color: isMe ? 'white' : '#1f2937',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderBottomRightRadius: isMe ? '4px' : '16px',
            borderBottomLeftRadius: isMe ? '16px' : '4px',
            wordBreak: 'break-word',
            position: 'relative',
            transition: 'transform 0.2s'
          }}
        >
          {/* Image Content */}
          {isImage && imageUrl && (
            <img
              src={imageUrl}
              alt="Shared"
              onClick={() => onImageClick?.(imageUrl)}
              style={{
                maxWidth: '250px',
                maxHeight: '200px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'block'
              }}
            />
          )}

          {/* Text Content */}
          {!isImage && (
            <div style={{ 
              fontSize: '15px', 
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
            }}>
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
            {formatTime(timestamp)}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactions).length > 0 && (
          <div style={{
            display: 'flex',
            gap: '4px',
            marginTop: '4px',
            justifyContent: isMe ? 'flex-end' : 'flex-start'
          }}>
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReaction?.(emoji)}
                style={{
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                {emoji} <span style={{ fontSize: '10px', color: '#6b7280' }}>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Status for my messages */}
        {isMe && <MessageStatus status={status} timestamp={timestamp} />}
      </div>

      {/* Reaction Picker */}
      {showReactions && !isMe && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '0',
          background: 'white',
          borderRadius: '20px',
          padding: '4px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          gap: '2px',
          zIndex: 10
        }}>
          {REACTION_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              style={{
                border: 'none',
                background: 'transparent',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}