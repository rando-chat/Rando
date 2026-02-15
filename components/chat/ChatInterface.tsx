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
    await chat.endChat()
    router.push('/matchmaking')
  }

  const handleReport = async (reason: string) => {
    // Implement report logic here
    console.log('Report submitted:', reason)
    setShowReport(false)
    // Show success message
    setShowSafetyWarning(true)
    setTimeout(() => setShowSafetyWarning(false), 3000)
  }

  const handleBlock = async () => {
    if (confirm('Block this user? They will not be able to match with you again.')) {
      // Implement block logic here
      console.log('User blocked')
      await handleEndChat()
    }
  }

  const handleAddFriend = async () => {
    // Implement add friend logic here
    console.log('Friend request sent')
  }

  const handleImageUpload = async (file: File) => {
    // Implement image upload logic here
    // This should upload to Supabase Storage and send message with URL
    console.log('Uploading image:', file.name)

    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Send message with image URL (you'd get the actual URL from storage)
    await chat.sendMessage(`📷 Image: [Uploaded: ${file.name}]`)
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        background: '#f9fafb',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Header */}
      <ChatHeader
        partnerName={chat.partnerName}
        isOnline={true}
        isTyping={chat.isTyping}
        partnerLeft={chat.partnerLeft}
        onOpenSidebar={() => setShowSidebar(true)}
        onReport={() => setShowReport(true)}
        onEndChat={handleEndChat}
      />

      {/* Main Chat Area */}
      <div style={{ 
        position: 'relative', 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Messages */}
        <ChatMessages
          messages={chat.messages}
          currentUserId={chat.guestSession?.guest_id}
          currentUserName={chat.guestSession?.display_name}
          partnerLeft={chat.partnerLeft}
          partnerName={chat.partnerName}
          onImageClick={setSelectedImage}
          messagesEndRef={chat.messagesEndRef}
          leftAt={leftAt}
        />

        {/* Typing Indicator */}
        {chat.isTyping && !chat.partnerLeft && (
          <TypingIndicator 
            names={[chat.partnerName]} 
            isVisible={true} 
          />
        )}
      </div>

      {/* Input Area - REMOVED onImageUpload */}
      {!chat.partnerLeft && (
        <ChatInput
          onSendMessage={chat.sendMessage}
          onTyping={() => chat.sendTyping(true)}
          isSending={chat.isSending}
          disabled={chat.partnerLeft}
        />
      )}

      {/* Safety Warning Toast */}
      {showSafetyWarning && (
        <SafetyWarning
          message="Report submitted to moderators"
          type="success"
          onClose={() => setShowSafetyWarning(false)}
        />
      )}

      {/* Sidebar */}
      <ChatSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        partnerName={chat.partnerName}
        chatDuration={chatDuration}
        messageCount={messageCount}
        onReport={() => {
          setShowSidebar(false)
          setShowReport(true)
        }}
        onBlock={handleBlock}
        onAddFriend={handleAddFriend}
      />

      {/* Modals - Image upload happens here */}
      <ChatModals
        showReport={showReport}
        onCloseReport={() => setShowReport(false)}
        onSubmitReport={handleReport}
        selectedImage={selectedImage}
        onCloseImage={() => setSelectedImage(null)}
        editImage={editImage}
        onCloseEdit={() => setEditImage(null)}
        onSendEdit={(file) => {
          handleImageUpload(file)
          setEditImage(null)
        }}
      />
    </div>
  )
}