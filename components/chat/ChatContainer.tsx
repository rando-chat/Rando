'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/useChat'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatModals } from './ChatModals'

interface ChatContainerProps {
  sessionId: string
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const router = useRouter()
  const chat = useChat(sessionId)
  
  const [showReport, setShowReport] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editImage, setEditImage] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const handleEndChat = async () => {
    await chat.endChat()
    router.push('/matchmaking')
  }

  const handleReport = async (reason: string) => {
    // You can implement report logic here
    console.log('Report:', reason)
    setShowReport(false)
  }

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
      <ChatHeader
        partnerName={chat.partnerName}
        isOnline={true}
        isTyping={chat.isTyping}
        partnerLeft={chat.partnerLeft}
        showMenu={showMenu}
        onToggleMenu={() => setShowMenu(!showMenu)}
        onReport={() => setShowReport(true)}
        onEndChat={handleEndChat}
      />

      <ChatMessages
        messages={chat.messages}
        currentUserId={chat.guestSession?.guest_id}
        currentUserName={chat.guestSession?.display_name}
        partnerLeft={chat.partnerLeft}
        partnerName={chat.partnerName}
        leftAt={null}
        onImageClick={setSelectedImage}
        messagesEndRef={chat.messagesEndRef}
      />

      {!chat.partnerLeft && (
        <ChatInput
          onSendMessage={chat.sendMessage}
          onTyping={chat.sendTyping}
          isSending={chat.isSending}
          sessionId={sessionId}
          guestId={chat.guestSession?.guest_id}
          displayName={chat.guestSession?.display_name}
          onEditImage={setEditImage}
        />
      )}

      <ChatModals
        showReport={showReport}
        onCloseReport={() => setShowReport(false)}
        onSubmitReport={handleReport}
        selectedImage={selectedImage}
        onCloseImage={() => setSelectedImage(null)}
        editImage={editImage}
        onCloseEdit={() => setEditImage(null)}
        onSendEdit={(file) => {
          // Handle image upload
          console.log('Upload:', file)
          setEditImage(null)
        }}
      />
    </div>
  )
}