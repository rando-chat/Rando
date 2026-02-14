'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { use } from 'react'

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params)
  const router = useRouter()
  
  const [session, setSession] = useState<any>(null)
  const [guestSession, setGuestSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<any>(null)

  // Initialize - get or create guest session
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get chat session
        const { data: chatSession } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (!chatSession) {
          throw new Error('Session not found')
        }

        setSession(chatSession)

        // Create/get guest session
        const { data } = await supabase.rpc('create_guest_session')
        if (data && data.length > 0) {
          setGuestSession(data[0])
        }

        // Load messages
        loadMessages()

        // Subscribe to new messages
        subscribeToMessages()

        setLoading(false)
      } catch (err) {
        console.error('Init error:', err)
        setLoading(false)
      }
    }

    initialize()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [sessionId])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  const subscribeToMessages = () => {
    if (channelRef.current) return

    const channel = supabase
      .channel(`chat-${sessionId}-${Date.now()}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const msg = payload.new
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })

        setTimeout(() => {
          const chatDiv = document.getElementById('chat-messages')
          if (chatDiv) chatDiv.scrollTop = chatDiv.scrollHeight
        }, 100)
      })
      .subscribe()

    channelRef.current = channel
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !session || !guestSession) return

    try {
      await supabase.from('messages').insert({
        session_id: sessionId,
        sender_id: guestSession.guest_id,
        sender_is_guest: true,
        sender_display_name: guestSession.display_name,
        content: messageInput,
        created_at: new Date().toISOString()
      })

      setMessageInput('')
    } catch (err) {
      console.error('Send error:', err)
    }
  }

  const uploadImage = async (file: File) => {
    if (!session || !guestSession) return

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

      await supabase.from('messages').insert({
        session_id: sessionId,
        sender_id: guestSession.guest_id,
        sender_is_guest: true,
        sender_display_name: guestSession.display_name,
        content: `📷 Image: ${publicUrl}`,
        created_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return

    uploadImage(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const endChat = async () => {
    if (!session) return

    await supabase
      .from('chat_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', sessionId)

    router.push('/matchmaking')
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            margin: '0 auto 20px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#6b7280' }}>Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!session || !guestSession) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 20 }}>Chat session not found</p>
          <button
            onClick={() => router.push('/matchmaking')}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Back to Matchmaking
          </button>
        </div>
      </div>
    )
  }

  const partnerName = session.user1_id === guestSession.guest_id 
    ? session.user2_display_name 
    : session.user1_display_name

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 20px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1f2937', margin: 0 }}>
            💬 {partnerName || 'Anonymous'}
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            You: {guestSession.display_name}
          </p>
        </div>
        <button
          onClick={endChat}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          End Chat
        </button>
      </div>

      {/* Messages */}
      <div 
        id="chat-messages"
        style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#9ca3af',
            padding: '60px 20px'
          }}>
            <p style={{ fontSize: 16 }}>No messages yet</p>
            <p style={{ fontSize: 14 }}>Say hi or share an image!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === guestSession.guest_id
            const isImage = msg.content.startsWith('📷 Image:')
            const imageUrl = isImage ? msg.content.replace('📷 Image: ', '') : null

            return (
              <div
                key={msg.id || i}
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: 12,
                    borderRadius: 12,
                    background: isMe ? '#667eea' : 'white',
                    color: isMe ? 'white' : '#1f2937',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600,
                    marginBottom: 4,
                    opacity: 0.8
                  }}>
                    {msg.sender_display_name}
                  </div>
                  {isImage ? (
                    <img 
                      src={imageUrl} 
                      alt="Shared" 
                      style={{ 
                        maxWidth: '100%',
                        borderRadius: 8,
                        marginTop: 4
                      }} 
                    />
                  ) : (
                    <div style={{ fontSize: 15 }}>{msg.content}</div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <div style={{ 
        padding: 16,
        background: 'white',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            style={{ 
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 15,
              outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Send
          </button>
        </div>

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
            width: '100%',
            padding: '10px',
            background: uploading ? '#9ca3af' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: 14
          }}
        >
          {uploading ? '📤 Uploading...' : '📷 Share Image'}
        </button>
      </div>
    </div>
  )
}