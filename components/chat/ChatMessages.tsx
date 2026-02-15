'use client'

import { ChatMessage } from './ChatMessage'
import { ChatSystemMessage } from './ChatSystemMessage'

interface ChatMessagesProps {
  messages: any[]
  currentUserId?: string
  currentUserName?: string
  partnerLeft: boolean
  onImageClick: (url: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
  leftAt?: string | null
}

export function ChatMessages({
  messages,
  currentUserId,
  currentUserName,
  partnerLeft,
  onImageClick,
  messagesEndRef,
  leftAt
}: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#60607a',
        padding: '20px',
        fontStyle: 'italic',
        fontSize: 'clamp(14px, 3.5vw, 16px)',
      }}>
        <p>No messages yet. Say hi! 👋</p>
      </div>
    )
  }

  // Get partner name from first message that's not from current user
  const firstPartnerMsg = messages.find(m => m.sender_id !== currentUserId)
  const partnerName = firstPartnerMsg?.sender_display_name || 'Partner'

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 'clamp(12px, 3vw, 20px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(8px, 2vw, 12px)',
    }}>
      {messages.map((msg) => {
        if (msg.sender_id === 'system') {
          return <ChatSystemMessage key={msg.id} message={msg.content} />
        }

        const isOwn = msg.sender_id === currentUserId
        const isImage = msg.content?.startsWith('📷 Image:')
        const imageUrl = isImage ? msg.content.replace('📷 Image: ', '') : null

        if (isImage && imageUrl) {
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                marginBottom: '4px',
              }}
            >
              <div style={{
                maxWidth: 'min(300px, 70vw)',
                background: isOwn ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.03)',
                padding: 'clamp(6px, 1.5vw, 8px)',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                borderBottomRightRadius: isOwn ? '4px' : '12px',
                borderBottomLeftRadius: isOwn ? '12px' : '4px',
                border: !isOwn ? '1px solid rgba(124,58,237,0.2)' : 'none',
              }}>
                {!isOwn && (
                  <div style={{
                    fontSize: 'clamp(11px, 2.8vw, 12px)',
                    color: '#7c3aed',
                    marginBottom: '4px',
                  }}>
                    {msg.sender_display_name}
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt="Shared"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'min(200px, 50vh)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => onImageClick(imageUrl)}
                />
                <div style={{
                  fontSize: 'clamp(9px, 2.2vw, 10px)',
                  marginTop: '4px',
                  textAlign: 'right',
                  color: isOwn ? 'rgba(255,255,255,0.7)' : '#60607a',
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        }

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
          margin: '16px 0',
        }}>
          <div style={{
            background: 'rgba(124,58,237,0.1)',
            borderRadius: '20px',
            padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
            textAlign: 'center',
            border: '1px dashed rgba(124,58,237,0.3)',
            backdropFilter: 'blur(4px)',
          }}>
            <p style={{ color: '#a0a0b0', margin: 0, fontSize: 'clamp(13px, 3.2vw, 14px)' }}>
              👋 {partnerName} left the chat
            </p>
            {leftAt && (
              <p style={{
                fontSize: 'clamp(10px, 2.5vw, 11px)',
                color: '#60607a',
                margin: '4px 0 0 0',
              }}>
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