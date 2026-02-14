'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function ChatPage({ params }: { params: { id: string } }) {
  const sessionId = params.id
  const router = useRouter()
  
  const [session, setSession] = useState<any>(null)
  const [guestSession, setGuestSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<any>(null)
  const presenceRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🔍 Loading chat session:', sessionId)
        
        const { data: chatSession, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError) throw sessionError
        if (!chatSession) throw new Error('Session not found')
        
        console.log('✅ Chat session loaded:', chatSession)
        setSession(chatSession)

        console.log('👤 Creating guest session...')
        const { data, error: guestError } = await supabase.rpc('create_guest_session')
        if (guestError) throw guestError

        if (data && data.length > 0) {
          const guest = data[0]
          console.log('✅ Guest session:', guest)
          setGuestSession(guest)
          
          // Debug: Check who I am in this chat
          console.log('🔍 Comparing IDs:')
          console.log('  guest_id:', guest.guest_id)
          console.log('  user1_id:', chatSession.user1_id)
          console.log('  user2_id:', chatSession.user2_id)
          console.log('  user1_display_name:', chatSession.user1_display_name)
          console.log('  user2_display_name:', chatSession.user2_display_name)
          
          const isUser1 = guest.guest_id === chatSession.user1_id
          console.log('  isUser1:', isUser1)
          console.log('  partner name:', isUser1 ? chatSession.user2_display_name : chatSession.user1_display_name)
          
          setupTypingPresence(guest)
        }

        await loadMessages()
        subscribeToMessages()
        setLoading(false)
      } catch (err) {
        console.error('❌ Init error:', err)
        setLoading(false)
      }
    }

    initialize()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (presenceRef.current) supabase.removeChannel(presenceRef.current)
      if (session?.id && session?.status === 'active') {
        supabase.from('chat_sessions').update({ 
          status: 'ended', 
          ended_at: new Date().toISOString() 
        }).eq('id', session.id)
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
      console.log('📨 Messages loaded:', data.length)
      setMessages(data)
    }
    scrollToBottom()
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const setupTypingPresence = (guest: any) => {
    if (!guest) return

    const presenceChannel = supabase.channel(`presence-${sessionId}`, {
      config: {
        presence: {
          key: guest.guest_id
        }
      }
    })
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const typingUsers = Object.keys(state).filter(key => {
          const userPresence = state[key] as any[]
          return userPresence[0]?.typing && key !== guest.guest_id
        })
        
        setPartnerTyping(typingUsers.length > 0)
      })
      .subscribe()

    presenceRef.current = presenceChannel
  }

  const handleTyping = () => {
    if (!guestSession || !presenceRef.current) return

    if (!isTyping) {
      setIsTyping(true)
      presenceRef.current.track({ 
        typing: true,
        user_id: guestSession.guest_id,
        name: guestSession.display_name
      })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      presenceRef.current?.track({ 
        typing: false,
        user_id: guestSession.guest_id
      })
    }, 1000)
  }

  const subscribeToMessages = () => {
    if (channelRef.current) return

    const channel = supabase
      .channel(`chat-${sessionId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const msg = payload.new
        console.log('📨 New message:', msg)
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        scrollToBottom()
      })
      .subscribe()

    channelRef.current = channel
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !session || !guestSession) return

    console.log('📤 Sending message:', messageInput)
    
    await supabase.from('messages').insert({
      session_id: sessionId,
      sender_id: guestSession.guest_id,
      sender_is_guest: true,
      sender_display_name: guestSession.display_name,
      content: messageInput,
      created_at: new Date().toISOString()
    })
    setMessageInput('')
    setIsTyping(false)
    if (presenceRef.current) {
      presenceRef.current.track({ typing: false })
    }
  }

  const uploadImage = async (file: File) => {
    if (!session || !guestSession) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${guestSession.guest_id}/${sessionId}/${Date.now()}.${fileExt}`
      const filePath = `chat-images/${fileName}`

      await supabase.storage.from('chat-images').upload(filePath, file)
      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath)

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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯']

  if (loading) {
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
          <button onClick={() => router.push('/matchmaking')} style={{ padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Back to Matchmaking</button>
        </div>
      </div>
    )
  }

  // FIXED: Partner name logic with fallback
  const isUser1 = guestSession.guest_id === session.user1_id
  const partnerName = isUser1 
    ? (session.user2_display_name || 'Anonymous') 
    : (session.user1_display_name || 'Anonymous')
  
  console.log('🎯 Partner name:', partnerName, 'isUser1:', isUser1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' }}>
      {/* Header with online status */}
      <div style={{ padding: '16px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1f2937', margin: 0 }}>
                💬 {partnerName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Online</span>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>•</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>You: {guestSession.display_name}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/matchmaking')} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>End Chat</button>
          </div>
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
            const showTimestamp = i === 0 || formatTime(msg.created_at) !== formatTime(messages[i-1]?.created_at)

            return (
              <div key={msg.id || i}>
                {showTimestamp && (
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', padding: '4px 12px', borderRadius: 12 }}>{formatTime(msg.created_at)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
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
                    {isMe && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {/* Typing indicator */}
        {partnerTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'white', padding: '12px 16px', borderRadius: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ animation: 'typing 1s infinite' }}>•</span>
                <span style={{ animation: 'typing 1s infinite 0.2s' }}>•</span>
                <span style={{ animation: 'typing 1s infinite 0.4s' }}>•</span>
              </div>
              <style>{`
                @keyframes typing { 
                  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 
                  30% { opacity: 1; transform: translateY(-4px); } 
                }
              `}</style>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: 16, background: 'white', borderTop: '1px solid #e5e7eb', position: 'relative' }}>
        {/* Emoji picker */}
        {showEmojiPicker && (
          <div style={{ 
            position: 'absolute', 
            bottom: '100%', 
            left: 16, 
            background: 'white', 
            borderRadius: 12, 
            padding: 12, 
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: 8,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8
          }}>
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setMessageInput(prev => prev + emoji)
                  setShowEmojiPicker(false)
                }}
                style={{ 
                  width: 40, 
                  height: 40, 
                  fontSize: 20, 
                  border: 'none', 
                  background: '#f3f4f6', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{ 
              padding: 12, 
              background: '#f3f4f6', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer',
              fontSize: 20,
              transition: 'all 0.2s'
            }}
          >
            😊
          </button>
          
          <input
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value)
              handleTyping()
            }}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            style={{ 
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 24,
              fontSize: 15,
              outline: 'none',
              transition: 'all 0.2s'
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
              padding: 12, 
              background: uploading ? '#9ca3af' : '#f3f4f6', 
              border: 'none', 
              borderRadius: 8, 
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 20,
              transition: 'all 0.2s'
            }}
          >
            📷
          </button>
          
          <button
            onClick={sendMessage}
            disabled={!messageInput.trim()}
            style={{ 
              padding: '12px 24px',
              background: messageInput.trim() ? '#667eea' : '#e5e7eb',
              color: messageInput.trim() ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: 24,
              cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              transition: 'all 0.2s',
              boxShadow: messageInput.trim() ? '0 4px 12px rgba(102,126,234,0.4)' : 'none'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}