'use client'

import { ChatMessage } from './ChatMessage'
import { ChatSystemMessage } from './ChatSystemMessage'

interface ChatMessagesProps {
  messages: any[]
  currentUserId?: string
  currentUserName?: string
  partnerLeft: boolean
  partnerName: string
  leftAt?: string | null
  onImageClick: (url: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function ChatMessages({
  messages,
  currentUserId,
  currentUserName,
  partnerLeft,
  partnerName,
  leftAt,
  onImageClick,
  messagesEndRef
}: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#9ca3af',
        padding: '20px'
      }}>
        <p>No messages yet. Say hi!</p>
      </div>
    )
  }

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px'
    }}>
      {messages.map((msg) => {
        if (msg.sender_id === 'system') {
          return <ChatSystemMessage key={msg.id} message={msg.content} />
        }

        const isOwn = msg.sender_id === currentUserId
        const isImage = msg.content?.startsWith('📷 Image:')
        const imageUrl = isImage ? msg.content.replace('📷 Image: ', '') : null

        // Handle image messages - we need to show the image
        if (isImage && imageUrl) {
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                marginBottom: '12px'
              }}
            >
              <div style={{
                maxWidth: '70%',
                background: isOwn ? '#667eea' : 'white',
                color: isOwn ? 'white' : '#1f2937',
                padding: '10px',
                borderRadius: '16px',
                borderBottomRightRadius: isOwn ? '4px' : '16px',
                borderBottomLeftRadius: isOwn ? '16px' : '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                  {msg.sender_display_name}
                </div>
                <img
                  src={imageUrl}
                  alt="Shared"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onImageClick(imageUrl)}
                />
                <div style={{
                  fontSize: '10px',
                  marginTop: '4px',
                  textAlign: 'right',
                  color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af'
                }}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )
        }

        // Regular text message
        return (
          <ChatMessage
            key={msg.id}
            id={msg.id}
            content={msg.content}
            sender={msg.sender_display_name}
            timestamp={msg.created_at}
            isOwn={isOwn}
            status={msg.read_by_recipient ? 'read' : 'delivered'}
          />
        )
      })}

      {partnerLeft && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          margin: '16px 0'
        }}>
          <div style={{
            background: '#f3f4f6',
            borderRadius: '20px',
            padding: '12px 24px',
            textAlign: 'center',
            border: '1px dashed #9ca3af'
          }}>
            <p style={{ color: '#6b7280', margin: 0 }}>
              👋 {partnerName} left the chat
            </p>
            {leftAt && (
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                Left at {new Date(leftAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}