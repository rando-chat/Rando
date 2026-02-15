'use client'

import { useState, useRef } from 'react'

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>
  onTyping: () => void
  isSending: boolean
  sessionId: string
  guestId?: string
  displayName?: string
  onEditImage: (url: string) => void
}

export function ChatInput({
  onSendMessage,
  onTyping,
  isSending,
  onEditImage
}: ChatInputProps) {
  const [messageInput, setMessageInput] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯', '😢', '😡', '🥰', '🤔']

  const handleSend = async () => {
    if (!messageInput.trim() || isSending) return
    await onSendMessage(messageInput)
    setMessageInput('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }

    onEditImage(URL.createObjectURL(file))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{ 
      padding: '16px', 
      background: 'white', 
      borderTop: '1px solid #e5e7eb', 
      position: 'relative'
    }}>
      {/* Emoji picker */}
      {showEmojiPicker && (
        <div style={{ 
          position: 'absolute', 
          bottom: '100%', 
          left: '16px', 
          background: 'white', 
          borderRadius: '12px', 
          padding: '12px', 
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb', 
          marginBottom: '8px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(6, 1fr)', 
          gap: '8px',
          zIndex: 10
        }}>
          {emojis.map(emoji => (
            <button 
              key={emoji} 
              onClick={() => { 
                setMessageInput(prev => prev + emoji)
                setShowEmojiPicker(false)
              }} 
              style={{ 
                width: '40px', 
                height: '40px', 
                fontSize: '20px', 
                border: 'none', 
                background: '#f3f4f6', 
                borderRadius: '8px', 
                cursor: 'pointer'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
          style={{ 
            padding: '12px', 
            background: '#f3f4f6', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontSize: '20px'
          }}
        >
          😊
        </button>
        
        <input
          value={messageInput}
          onChange={(e) => {
            setMessageInput(e.target.value)
            onTyping()
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={{ 
            flex: 1,
            padding: '12px 16px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '24px', 
            fontSize: '15px', 
            outline: 'none'
          }}
        />
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={uploading} 
          style={{ 
            padding: '12px', 
            background: uploading ? '#9ca3af' : '#f3f4f6', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: uploading ? 'not-allowed' : 'pointer', 
            fontSize: '20px',
            opacity: uploading ? 0.7 : 1
          }}
        >
          📷
        </button>
        
        <button 
          onClick={handleSend} 
          disabled={!messageInput.trim() || isSending} 
          style={{ 
            padding: '12px 24px', 
            background: messageInput.trim() && !isSending ? '#667eea' : '#e5e7eb', 
            color: messageInput.trim() && !isSending ? 'white' : '#9ca3af', 
            border: 'none', 
            borderRadius: '24px', 
            cursor: messageInput.trim() && !isSending ? 'pointer' : 'not-allowed', 
            fontWeight: 600, 
            fontSize: '15px'
          }}
        >
          {isSending ? '...' : 'Send'}
        </button>
      </div>
      
      {uploading && (
        <div style={{ 
          position: 'absolute', 
          bottom: '100%', 
          left: '50%', 
          transform: 'translateX(-50%)',
          background: '#1f2937', 
          color: 'white', 
          padding: '4px 12px', 
          borderRadius: '20px', 
          fontSize: '12px',
          marginBottom: '8px'
        }}>
          📤 Uploading...
        </div>
      )}
    </div>
  )
}