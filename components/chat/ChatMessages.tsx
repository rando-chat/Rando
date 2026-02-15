'use client'

import { ChatMessage } from './ChatMessage'
import { ChatSystemMessage } from './ChatSystemMessage'

interface ChatMessagesProps {
  messages: any[]
  currentUserId?: string
  currentUserName?: string
  partnerLeft: boolean
  partnerName: string
  leftAt: string | null
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

        const isMe = msg.sender_id === currentUserId
        const isImage = msg.content?.startsWith('📷 Image:')
        const imageUrl = isImage ? msg.content.replace('📷 Image: ', '') : null

        return (
          <ChatMessage
            key={msg.id}
            content={msg.content}
            senderName={msg.sender_display_name}
            isMe={isMe}
            isImage={isImage}
            imageUrl={imageUrl}
            timestamp={msg.created_at}
            onImageClick={() => imageUrl && onImageClick(imageUrl)}
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