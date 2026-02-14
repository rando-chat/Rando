'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<any>
  isSending: boolean
  sessionId: string
  guestSession: any
}

export function MessageInput({ onSendMessage, isSending, sessionId, guestSession }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯', '🙌', '👏']

  const handleSend = async () => {
    if (!message.trim() || isSending) return
    
    await onSendMessage(message)
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !guestSession) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${guestSession.guest_id}/${sessionId}/${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)

      await onSendMessage(`📷 Image: ${publicUrl}`)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {showEmoji && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg flex flex-wrap gap-2">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setMessage(prev => prev + emoji)
                setShowEmoji(false)
              }}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 text-gray-500 hover:text-gray-700 transition"
        >
          😊
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
        >
          {uploading ? '⏳' : '📷'}
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-purple-500"
          disabled={isSending || uploading}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending || uploading}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}