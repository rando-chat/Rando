'use client'

import { useState, useRef } from 'react'

interface ChatInputProps {
  sessionId: string
  onSendMessage: (content: string) => Promise<void>
  onTyping: () => void
  isSending: boolean
  onEditImage: (url: string) => void
}

export function ChatInput({
  sessionId,
  onSendMessage,
  onTyping,
  isSending,
  onEditImage
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSending) return

    await onSendMessage(message)
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    const url = URL.createObjectURL(file)
    onEditImage(url)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 'clamp(12px, 3vw, 16px)',
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(124,58,237,0.2)',
        display: 'flex',
        gap: 'clamp(8px, 2vw, 12px)',
        zIndex: 20,
        position: 'relative',
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isSending}
        style={{
          padding: 'clamp(10px, 2.5vw, 12px)',
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'clamp(8px, 2vw, 12px)',
          color: '#7c3aed',
          cursor: isSending ? 'not-allowed' : 'pointer',
          fontSize: 'clamp(16px, 4vw, 18px)',
          transition: 'all 0.2s ease',
        }}
      >
        📷
      </button>

      <input
        type="text"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          onTyping()
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Type a message..."
        disabled={isSending}
        style={{
          flex: 1,
          padding: 'clamp(10px, 2.5vw, 12px)',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${isFocused ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`,
          borderRadius: 'clamp(8px, 2vw, 12px)',
          color: '#f0f0f0',
          fontSize: 'clamp(14px, 3.5vw, 16px)',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
      />
      
      <button
        type="submit"
        disabled={!message.trim() || isSending}
        style={{
          padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 24px)',
          background: !message.trim() || isSending ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: 'white',
          border: 'none',
          borderRadius: 'clamp(8px, 2vw, 12px)',
          cursor: (!message.trim() || isSending) ? 'not-allowed' : 'pointer',
          fontSize: 'clamp(14px, 3.5vw, 16px)',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
      >
        Send
      </button>
    </form>
  )
}