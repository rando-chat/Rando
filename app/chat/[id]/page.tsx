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
  const [showMenu, setShowMenu] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editImage, setEditImage] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, string[]>>({})
  const [friends, setFriends] = useState<any[]>([])
  const [showFriends, setShowFriends] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showReport, setShowReport] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)

  // Handle resize for responsiveness
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 640

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯', '😢', '😡', '🥰', '🤔']
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡']

  // Simulate online status changes
  useEffect(() => {
    const onlineInterval = setInterval(() => {
      setIsOnline(Math.random() > 0.3) // 70% chance online
    }, 30000)
    return () => clearInterval(onlineInterval)
  }, [])

  // Simulate typing indicator
  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }
    }, 10000)
    return () => clearInterval(typingInterval)
  }, [])

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
    setEditImage(URL.createObjectURL(file))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEditImage = () => {
    if (!editImage) return
    // In a real app, you'd have an image editor here
    // For now, just send it
    const fileInput = fileInputRef.current?.files?.[0]
    if (fileInput) uploadImage(fileInput)
    setEditImage(null)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    setReactions(prev => {
      const messageReactions = prev[messageId] || []
      if (messageReactions.includes(emoji)) {
        return {
          ...prev,
          [messageId]: messageReactions.filter(e => e !== emoji)
        }
      }
      return {
        ...prev,
        [messageId]: [...messageReactions, emoji]
      }
    })
  }

  const handleAddFriend = async () => {
    const partnerName = isUser1 ? session.user2_display_name : session.user1_display_name
    setFriends(prev => [...prev, { name: partnerName, id: Date.now() }])
    setShowMenu(false)
    alert(`${partnerName} added to friends!`)
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    // In a real app, this would call your reporting API
    alert(`Report sent: ${reportReason}`)
    setShowReport(false)
    setReportReason('')
    setShowMenu(false)
  }

  const handleBlock = async () => {
    if (confirm('Block this user? They will not be able to match with you again.')) {
      alert('User blocked')
      await endChat()
      router.push('/matchmaking')
    }
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
  const partnerId = isUser1 ? session.user2_id : session.user1_id

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: '#f9fafb',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      position: 'relative'
    }}>
      {/* Image Editor Modal */}
      {editImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Edit Image</h3>
            <img src={editImage} alt="Edit" style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditImage(null)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleEditImage} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          cursor: 'pointer'
        }} onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Full size" style={{ maxWidth: '90%', maxHeight: '90%' }} />
        </div>
      )}

      {/* Friends List Modal */}
      {showFriends && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowFriends(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '400px',
            width: '100%',
            maxHeight: '80%',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Friends ({friends.length})</h3>
            {friends.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>No friends yet</p>
            ) : (
              friends.map(friend => (
                <div key={friend.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{friend.name}</span>
                  <button style={{ color: '#667eea', background: 'none', border: 'none', cursor: 'pointer' }}>Message</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowReport(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '400px',
            width: '100%'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>Report User</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Why are you reporting this user?"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '16px',
                minHeight: '100px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReport(false)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleReport} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Send Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Responsive with menu */}
      <div style={{ 
        padding: isMobile ? '12px 16px' : '16px 20px', 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isOnline ? '#10b981' : '#9ca3af',
                animation: isOnline ? 'pulse 2s infinite' : 'none'
              }} />
              <style>{`
                @keyframes pulse {
                  0% { opacity: 1; }
                  50% { opacity: 0.5; }
                  100% { opacity: 1; }
                }
              `}</style>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
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
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '12px', color: '#667eea' }}>typing</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <span style={{ animation: 'typing 1s infinite' }}>.</span>
                    <span style={{ animation: 'typing 1s infinite 0.2s' }}>.</span>
                    <span style={{ animation: 'typing 1s infinite 0.4s' }}>.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowFriends(true)}
              style={{ 
                padding: isMobile ? '6px' : '8px', 
                background: '#f3f4f6', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: isMobile ? '16px' : '18px'
              }}
              title="Friends"
            >
              👥
            </button>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                style={{ 
                  padding: isMobile ? '6px' : '8px', 
                  background: '#f3f4f6', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: isMobile ? '16px' : '18px'
                }}
              >
                ⋮
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  minWidth: '180px',
                  zIndex: 100
                }}>
                  <button
                    onClick={handleAddFriend}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: isMobile ? '14px' : '15px'
                    }}
                  >
                    ➕ Add Friend
                  </button>
                  <button
                    onClick={() => {
                      setShowReport(true)
                      setShowMenu(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: isMobile ? '14px' : '15px',
                      color: '#f59e0b'
                    }}
                  >
                    ⚠️ Report
                  </button>
                  <button
                    onClick={handleBlock}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: isMobile ? '14px' : '15px',
                      color: '#ef4444'
                    }}
                  >
                    🚫 Block User
                  </button>
                </div>
              )}
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
                marginLeft: '4px'
              }}
            >
              End Chat
            </button>
          </div>
        </div>
      </div>

      {/* Messages - Responsive with reactions */}
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
            const messageReactions = reactions[msg.id] || []

            return (
              <div key={msg.id || i} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                width: '100%',
                position: 'relative'
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
                  <div 
                    style={{ 
                      padding: isMobile ? '10px' : '12px', 
                      borderRadius: '16px', 
                      background: isMe ? '#667eea' : 'white', 
                      color: isMe ? 'white' : '#1f2937', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      borderBottomRightRadius: isMe ? '4px' : '16px',
                      borderBottomLeftRadius: isMe ? '16px' : '4px',
                      wordBreak: 'break-word',
                      position: 'relative',
                      cursor: isImage ? 'pointer' : 'default'
                    }}
                    onClick={() => isImage && setSelectedImage(imageUrl)}
                  >
                    {isImage ? (
                      <img 
                        src={imageUrl} 
                        alt="Shared" 
                        style={{ 
                          maxWidth: '100%', 
                          borderRadius: '8px', 
                          maxHeight: isMobile ? '150px' : '200px',
                          width: 'auto',
                          height: 'auto',
                          cursor: 'pointer'
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
                    
                    {/* Reactions bar */}
                    {!isImage && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-20px',
                        right: isMe ? '0' : 'auto',
                        left: isMe ? 'auto' : '0',
                        display: 'flex',
                        gap: '4px',
                        background: 'white',
                        borderRadius: '20px',
                        padding: '2px 4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 5
                      }}>
                        {reactionEmojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReaction(msg.id, emoji)
                            }}
                            style={{
                              border: 'none',
                              background: messageReactions.includes(emoji) ? '#e5e7eb' : 'transparent',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              fontSize: '14px',
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
                  </div>
                  
                  {/* Show reactions */}
                  {messageReactions.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '2px',
                      marginTop: '4px',
                      justifyContent: isMe ? 'flex-end' : 'flex-start'
                    }}>
                      {messageReactions.map(emoji => (
                        <span key={emoji} style={{ fontSize: '12px' }}>{emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Responsive with edit option */}
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
            gridTemplateColumns: `repeat(${isMobile ? 4 : 6}, 1fr)`, 
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