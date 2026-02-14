'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useChat } from '@/hooks/useChat'

export default function ChatPage({ params }: { params: { id: string } }) {
  const sessionId = params.id
  const router = useRouter()
  const { session, guestSession, messages, isLoading, sendMessage, endChat } = useChat(sessionId)
  
  const [messageInput, setMessageInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯']

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return
    await sendMessage(messageInput)
    setMessageInput('')
  }

  const uploadImage = async (file: File) => {
    if (!session || !guestSession) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${guestSession.guest_id}/${sessionId}/${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      const { error: uploadError } = await supabase.storage.from('chat-images').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath)

      await sendMessage(`📷 Image: ${publicUrl}`)
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return
    uploadImage(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEndChat = async () => {
    await endChat()
    router.push('/matchmaking')
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, margin: '0 auto 20px', border: '4px solid #e5e7eb', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#6b7280' }}>Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!session || !guestSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 20 }}>Chat session not found</p>
          <button onClick={() => router.push('/matchmaking')} style={{ padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Back to Matchmaking
          </button>
        </div>
      </div>
    )
  }

  const isUser1 = guestSession.guest_id === session.user1_id
  const partnerName = isUser1 ? (session.user2_display_name || 'Anonymous') : (session.user1_display_name || 'Anonymous')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1f2937', margin: 0 }}>
              💬 {partnerName}
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              You: {guestSession.display_name}
            </p>
          </div>
          <button onClick={handleEndChat} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            End Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 20px' }}>
            <p style={{ fontSize: 16 }}>No messages yet</p>
            <p style={{ fontSize: 14 }}>Say hi or share an image!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === guestSession.guest_id
            const isImage = msg.content.startsWith('📷 Image:')
            const imageUrl = isImage ? msg.content.replace('📷 Image: ', '') : null

            return (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, textAlign: isMe ? 'right' : 'left' }}>
                    {msg.sender_display_name}
                  </div>
                  <div style={{ 
                    padding: 12, 
                    borderRadius: 16, 
                    background: isMe ? '#667eea' : 'white', 
                    color: isMe ? 'white' : '#1f2937', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                  }}>
                    {isImage ? (
                      <img src={imageUrl} alt="Shared" style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 200 }} />
                    ) : (
                      <div style={{ fontSize: 15, lineHeight: '1.4' }}>{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 16, background: 'white', borderTop: '1px solid #e5e7eb', position: 'relative' }}>
        {showEmojiPicker && (
          <div style={{ position: 'absolute', bottom: '100%', left: 16, background: 'white', borderRadius: 12, padding: 12, boxShadow: '0 -4px 12px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', marginBottom: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {emojis.map(emoji => (
              <button key={emoji} onClick={() => { setMessageInput(prev => prev + emoji); setShowEmojiPicker(false); }} style={{ width: 40, height: 40, fontSize: 20, border: 'none', background: '#f3f4f6', borderRadius: 8, cursor: 'pointer' }}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ padding: 12, background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 20 }}>
            😊
          </button>
          
          <input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 24, fontSize: 15, outline: 'none' }}
          />
          
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" style={{ display: 'none' }} />
          
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: 12, background: uploading ? '#9ca3af' : '#f3f4f6', border: 'none', borderRadius: 8, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 20 }}>
            📷
          </button>
          
          <button onClick={handleSendMessage} disabled={!messageInput.trim()} style={{ padding: '12px 24px', background: messageInput.trim() ? '#667eea' : '#e5e7eb', color: messageInput.trim() ? 'white' : '#9ca3af', border: 'none', borderRadius: 24, cursor: messageInput.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, boxShadow: messageInput.trim() ? '0 4px 12px rgba(102,126,234,0.4)' : 'none' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}