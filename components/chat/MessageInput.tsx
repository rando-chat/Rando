'use client'

import { useState } from 'react'

interface MessageInputProps {
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MessageInput({ onSend, placeholder = 'Type a message...', disabled }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSend(message)
      setMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px', background: 'white', borderTop: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '24px',
            fontSize: '15px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          style={{
            padding: '12px 24px',
            background: message.trim() ? '#667eea' : '#e5e7eb',
            color: message.trim() ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '24px',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 600
          }}
        >
          Send
        </button>
      </div>
    </form>
  )
}