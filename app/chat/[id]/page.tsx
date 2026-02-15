'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)

  // Handle resize for responsiveness
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 640

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f9fafb',
        padding: '16px'
      }}>
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            margin: '0 auto 20px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#6b7280', fontSize: isMobile ? '14px' : '16px' }}>Loading chat...</p>
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
        justifyContent: 'center',
        padding: '16px'
      }}>
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <p style={{ color: '#ef4444', marginBottom: 20, fontSize: isMobile ? '14px' : '16px' }}>Chat session not found</p>
          <button 
            onClick={() => router.push('/matchmaking')} 
            style={{ 
              padding: isMobile ? '10px 20px' : '12px 24px', 
              background: '#667eea', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto',
              fontSize: isMobile ? '14px' : '16px'
            }}
          >
            Back to Matchmaking
          </button>
        </div>
      </div>
    )
  }

  const isUser1 = guestSession.guest_id === session.user1_id
  const partnerName = isUser1 ? (session.user2_display_name || 'Anonymous') : (session.user1_display_name || 'Anonymous')

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: '#f9fafb',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Header - Responsive */}
      <div style={{ 
        padding: isMobile ? '12px 16px' : '16px 20px', 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ 
              fontSize: isMobile ? '18px' : '20px', 
              fontWeight: 600, 
              color: '#1f2937', 
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              💬 {partnerName}
            </h1>
            <p style={{ 
              fontSize: isMobile ? '12px' : '13px', 
              color: '#6b7280', 
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              You: {guestSession.display_name}
            </p>
          </div>
          <button 
            onClick={handleEndChat} 
            style={{ 
              padding: isMobile ? '6px 12px' : '8px 16px', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: isMobile ? '12px' : '14px',
              whiteSpace: 'nowrap',
              marginLeft: '8px'
            }}
          >
            End Chat
          </button>
        </div>
      </div>

      {/* Messages - Responsive */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: isMobile ? '12px' : '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? '12px' : '16px'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#9ca3af', 
            padding: isMobile ? '40px 16px' : '60px 20px'
          }}>
            <p style={{ fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>No messages yet</p>
            <p style={{ fontSize: isMobile ? '12px' : '14px' }}>Say hi or share an image!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === guestSession.guest_id
            const isImage = msg.content.startsWith('📷 Image:')
            const imageUrl = isImage ? msg.content.replace('📷 Image: ', '') : null

            return (
              <div key={msg.id || i} style={{ 
                display: 'flex', 
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                width: '100%'
              }}>
                <div style={{ 
                  maxWidth: isMobile ? '85%' : '70%',
                  minWidth: isMobile ? '60%' : 'auto'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '11px' : '12px', 
                    color: '#6b7280', 
                    marginBottom: '4px', 
                    textAlign: isMe ? 'right' : 'left',
                    padding: isMe ? '0 4px 0 0' : '0 0 0 4px'
                  }}>
                    {msg.sender_display_name}
                  </div>
                  <div style={{ 
                    padding: isMobile ? '10px' : '12px', 
                    borderRadius: '16px', 
                    background: isMe ? '#667eea' : 'white', 
                    color: isMe ? 'white' : '#1f2937', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderBottomRightRadius: isMe ? '4px' : '16px',
                    borderBottomLeftRadius: isMe ? '16px' : '4px',
                    wordBreak: 'break-word'
                  }}>
                    {isImage ? (
                      <img 
                        src={imageUrl} 
                        alt="Shared" 
                        style={{ 
                          maxWidth: '100%', 
                          borderRadius: '8px', 
                          maxHeight: isMobile ? '150px' : '200px',
                          width: 'auto',
                          height: 'auto'
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        fontSize: isMobile ? '14px' : '15px', 
                        lineHeight: '1.4' 
                      }}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Responsive */}
      <div style={{ 
        padding: isMobile ? '12px' : '16px', 
        background: 'white', 
        borderTop: '1px solid #e5e7eb', 
        position: 'relative'
      }}>
        {/* Emoji picker - Responsive */}
        {showEmojiPicker && (
          <div style={{ 
            position: 'absolute', 
            bottom: '100%', 
            left: isMobile ? '8px' : '16px', 
            right: isMobile ? '8px' : 'auto',
            background: 'white', 
            borderRadius: '12px', 
            padding: isMobile ? '8px' : '12px', 
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb', 
            marginBottom: '8px', 
            display: 'grid', 
            gridTemplateColumns: `repeat(${isMobile ? 4 : 4}, 1fr)`, 
            gap: isMobile ? '4px' : '8px',
            maxWidth: isMobile ? 'calc(100% - 16px)' : 'auto',
            zIndex: 10
          }}>
            {emojis.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => { 
                  setMessageInput(prev => prev + emoji); 
                  setShowEmojiPicker(false); 
                }} 
                style={{ 
                  width: isMobile ? '36px' : '40px', 
                  height: isMobile ? '36px' : '40px', 
                  fontSize: isMobile ? '18px' : '20px', 
                  border: 'none', 
                  background: '#f3f4f6', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '6px' : '8px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            style={{ 
              padding: isMobile ? '10px' : '12px', 
              background: '#f3f4f6', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: isMobile ? '18px' : '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px'
            }}
          >
            😊
          </button>
          
          <input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            style={{ 
              flex: 1,
              minWidth: isMobile ? '120px' : '200px',
              padding: isMobile ? '10px 12px' : '12px 16px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '24px', 
              fontSize: isMobile ? '14px' : '15px', 
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
              padding: isMobile ? '10px' : '12px', 
              background: uploading ? '#9ca3af' : '#f3f4f6', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: uploading ? 'not-allowed' : 'pointer', 
              fontSize: isMobile ? '18px' : '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              opacity: uploading ? 0.7 : 1
            }}
          >
            📷
          </button>
          
          <button 
            onClick={handleSendMessage} 
            disabled={!messageInput.trim()} 
            style={{ 
              padding: isMobile ? '10px 16px' : '12px 24px', 
              background: messageInput.trim() ? '#667eea' : '#e5e7eb', 
              color: messageInput.trim() ? 'white' : '#9ca3af', 
              border: 'none', 
              borderRadius: '24px', 
              cursor: messageInput.trim() ? 'pointer' : 'not-allowed', 
              fontWeight: 600, 
              fontSize: isMobile ? '14px' : '15px',
              whiteSpace: 'nowrap',
              boxShadow: messageInput.trim() ? '0 4px 12px rgba(102,126,234,0.4)' : 'none',
              minWidth: isMobile ? '60px' : '70px'
            }}
          >
            Send
          </button>
        </div>
        
        {/* Uploading indicator */}
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
            marginBottom: '8px',
            whiteSpace: 'nowrap'
          }}>
            📤 Uploading image...
          </div>
        )}
      </div>
    </div>
  )
}