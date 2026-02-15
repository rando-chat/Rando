'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/useChat'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatSidebar } from './ChatSidebar'
import { ChatModals } from './ChatModals'
import { TypingIndicator } from './TypingIndicator'
import { SafetyWarning } from './SafetyWarning'
import { DebugLogger } from './DebugLogger'

interface ChatInterfaceProps {
  sessionId: string
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const router = useRouter()
  const chat = useChat(sessionId)

  const [showSidebar, setShowSidebar] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editImage, setEditImage] = useState<string | null>(null)
  const [showSafetyWarning, setShowSafetyWarning] = useState(false)
  const [chatDuration, setChatDuration] = useState('0m')
  const [messageCount, setMessageCount] = useState(0)
  const [leftAt, setLeftAt] = useState<string | undefined>()

  const containerRef = useRef<HTMLDivElement>(null)

  // Debug logging to console
  useEffect(() => {
    console.log('🔍 ========== CHAT INTERFACE MOUNTED ==========')
    console.log('🔍 sessionId:', sessionId)
    console.log('🔍 guestSession:', chat.guestSession)
    console.log('🔍 myName:', chat.myName)
    console.log('🔍 partnerName:', chat.partnerName)
    console.log('🔍 messages count:', chat.messages.length)
    console.log('🔍 ==========================================')
  }, [sessionId, chat.guestSession, chat.myName, chat.partnerName, chat.messages])

  // Log when messages update
  useEffect(() => {
    if (chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1]
      console.log('📨 New message:', {
        id: lastMsg.id,
        from: lastMsg.sender_display_name,
        content: lastMsg.content,
        isImage: lastMsg.content.startsWith('📷 Image:'),
        time: new Date(lastMsg.created_at).toLocaleTimeString()
      })
    }
  }, [chat.messages])

  // Update stats
  useEffect(() => {
    if (chat.messages.length > 0) {
      setMessageCount(chat.messages.length)

      const firstMsg = new Date(chat.messages[0].created_at)
      const now = new Date()
      const diff = Math.floor((now.getTime() - firstMsg.getTime()) / 60000)
      setChatDuration(`${diff}m`)
    }
  }, [chat.messages])

  // Set leftAt when partner leaves
  useEffect(() => {
    if (chat.partnerLeft && !leftAt) {
      setLeftAt(new Date().toISOString())
      console.log('👋 Partner left at:', leftAt)
    }
  }, [chat.partnerLeft, leftAt])

  // Handle escape key to close modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSidebar(false)
        setShowReport(false)
        setSelectedImage(null)
        setEditImage(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const handleEndChat = async () => {
    console.log('👋 Ending chat...')
    await chat.endChat()
    router.push('/matchmaking')
  }

  const handleReport = async (reason: string, category: string = 'other') => {
    if (!chat.guestSession || !sessionId) return
    
    console.log('⚠️ Reporting user:', { reason, category })
    try {
      await chat.reportUser(reason, category)
      setShowReport(false)
      setShowSafetyWarning(true)
      setTimeout(() => setShowSafetyWarning(false), 3000)
      console.log('✅ Report submitted')
    } catch (err) {
      console.error('❌ Report error:', err)
    }
  }

  const handleBlock = async () => {
    if (confirm('Block this user? They will not be able to match with you again.')) {
      console.log('🚫 Blocking user...')
      await chat.blockUser()
      await handleEndChat()
    }
  }

  const handleAddFriend = async () => {
    console.log('➕ Adding friend...')
    await chat.addFriend()
    setShowSafetyWarning(true)
    setTimeout(() => setShowSafetyWarning(false), 3000)
    console.log('✅ Friend request sent')
  }

  const handleImageUpload = async (file: File) => {
    if (!chat.guestSession || !sessionId) {
      console.log('❌ Cannot upload image: missing session')
      return
    }
    console.log('📷 Starting image upload:', file.name)
    console.log('📷 File type:', file.type)
    console.log('📷 File size:', file.size)
    
    const result = await chat.uploadImage(file)
    if (result) {
      console.log('✅ Image uploaded successfully:', result)
    } else {
      console.log('❌ Image upload failed')
    }
  }

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0a0a0f',
        position: 'relative',
        overflow: 'hidden',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 'min(600px, 80vw)', height: 'min(600px, 80vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          animation: 'float1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 'min(500px, 70vw)', height: 'min(500px, 70vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
          animation: 'float2 10s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-40px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,30px)} }
      `}</style>

      {/* Header */}
      <ChatHeader
        partnerName={chat.partnerName}
        isOnline={true}
        isTyping={chat.isTyping}
        partnerLeft={chat.partnerLeft}
        onOpenSidebar={() => {
          console.log('📊 Opening sidebar')
          setShowSidebar(true)
        }}
        onReport={() => {
          console.log('⚠️ Opening report modal')
          setShowReport(true)
        }}
        onEndChat={handleEndChat}
      />

      {/* Main Chat Area */}
      <div style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}>
        <ChatMessages
          messages={chat.messages}
          currentUserId={chat.guestSession?.guest_id}
          currentUserName={chat.guestSession?.display_name}
          partnerLeft={chat.partnerLeft}
          partnerName={chat.partnerName}
          onImageClick={(url) => {
            console.log('🖼️ Opening image:', url)
            setSelectedImage(url)
          }}
          messagesEndRef={chat.messagesEndRef}
          leftAt={leftAt}
        />

        {chat.isTyping && !chat.partnerLeft && (
          <TypingIndicator
            names={[chat.partnerName]}
            isVisible={true}
          />
        )}
      </div>

      {/* Input Area */}
      {!chat.partnerLeft && (
        <ChatInput
          sessionId={sessionId}
          onSendMessage={async (content) => {
            console.log('📤 Sending message:', content)
            await chat.sendMessage(content)
          }}
          onTyping={() => chat.sendTyping(true)}
          isSending={chat.isSending}
          onEditImage={(url) => {
            console.log('✏️ Editing image:', url)
            setEditImage(url)
          }}
        />
      )}

      {/* Safety Warning */}
      {showSafetyWarning && (
        <SafetyWarning
          message="Friend request sent!"
          type="success"
          onClose={() => setShowSafetyWarning(false)}
        />
      )}

      {/* Sidebar */}
      <ChatSidebar
        isOpen={showSidebar}
        onClose={() => {
          console.log('📊 Closing sidebar')
          setShowSidebar(false)
        }}
        partnerName={chat.partnerName}
        chatDuration={chatDuration}
        messageCount={messageCount}
        onReport={() => {
          setShowSidebar(false)
          setShowReport(true)
        }}
        onBlock={handleBlock}
        onAddFriend={handleAddFriend}
        guestId={chat.guestSession?.guest_id}
      />

      {/* Modals */}
      <ChatModals
        showReport={showReport}
        onCloseReport={() => {
          console.log('⚠️ Closing report modal')
          setShowReport(false)
        }}
        onSubmitReport={handleReport}
        selectedImage={selectedImage}
        onCloseImage={() => {
          console.log('🖼️ Closing image')
          setSelectedImage(null)
        }}
        editImage={editImage}
        onCloseEdit={() => {
          console.log('✏️ Closing edit')
          setEditImage(null)
        }}
        onSendEdit={(file) => {
          handleImageUpload(file)
          setEditImage(null)
        }}
      />

      {/* DEBUG VISUAL INDICATOR */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: '#7c3aed',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        zIndex: 100000,
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
        pointerEvents: 'none'
      }}>
        🐞 DEBUG MODE ACTIVE
      </div>

      {/* Debug Logger */}
      <DebugLogger
        sessionId={sessionId}
        guestSession={chat.guestSession}
        messages={chat.messages}
        partnerName={chat.partnerName}
        myName={chat.myName || ''}
      />

      {/* TEMPORARY TEST BUTTONS */}
      <div style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        zIndex: 100000,
        display: 'flex',
        gap: '10px',
        flexDirection: 'column'
      }}>
        <button
          onClick={async () => {
            console.log('🧪 TEST: Manual image upload test')
            // Create a test image (a small red dot)
            const canvas = document.createElement('canvas')
            canvas.width = 100
            canvas.height = 100
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.fillStyle = 'red'
              ctx.fillRect(0, 0, 100, 100)
            }
            
            canvas.toBlob(async (blob) => {
              if (blob) {
                const testFile = new File([blob], 'test-image.jpg', { type: 'image/jpeg' })
                console.log('🧪 Test file created:', testFile.name, testFile.size)
                await chat.uploadImage(testFile)
              }
            }, 'image/jpeg')
          }}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
          }}
        >
          🧪 TEST IMAGE UPLOAD
        </button>
        
        <button
          onClick={() => {
            console.log('🧪 TEST: Check session data')
            console.log('Session ID:', sessionId)
            console.log('Guest session:', chat.guestSession)
            console.log('Partner name:', chat.partnerName)
            console.log('My name:', chat.myName)
            alert(`Session: ${sessionId}\nMy name: ${chat.myName}\nPartner: ${chat.partnerName}`)
          }}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
          }}
        >
          🧪 CHECK SESSION
        </button>
      </div>
    </div>
  )
}