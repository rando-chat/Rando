'use client'

interface ChatMessageProps {
  content: string
  senderName: string
  isMe: boolean
  isImage: boolean
  imageUrl: string | null
  timestamp: string
  onImageClick: () => void
}

export function ChatMessage({
  content,
  senderName,
  isMe,
  isImage,
  imageUrl,
  timestamp,
  onImageClick
}: ChatMessageProps) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: isMe ? 'flex-end' : 'flex-start',
      width: '100%'
    }}>
      <div style={{ maxWidth: '70%' }}>
        <div style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginBottom: '4px', 
          textAlign: isMe ? 'right' : 'left' 
        }}>
          {senderName}
        </div>
        
        <div 
          style={{ 
            padding: '12px', 
            borderRadius: '16px', 
            background: isMe ? '#667eea' : 'white', 
            color: isMe ? 'white' : '#1f2937', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderBottomRightRadius: isMe ? '4px' : '16px',
            borderBottomLeftRadius: isMe ? '16px' : '4px',
            wordBreak: 'break-word',
            cursor: isImage ? 'pointer' : 'default'
          }}
          onClick={isImage ? onImageClick : undefined}
        >
          {isImage && imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Shared" 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '200px', 
                borderRadius: '8px',
                cursor: 'pointer'
              }} 
            />
          ) : (
            <div style={{ fontSize: '15px', lineHeight: '1.4' }}>
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}