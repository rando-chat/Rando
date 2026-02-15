'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/useChat'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatModals } from './ChatModals'
import { TypingIndicator } from './TypingIndicator'

interface ChatContainerProps {
  sessionId: string
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const router = useRouter()
  const chat = useChat(sessionId)
  
  const [showReport, setShowReport] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editImage, setEditImage] = useState<string | null>(null)
  const [chatDuration, setChatDuration] = useState('0m')
  const [messageCount, setMessageCount] = useState(0)

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

  const handleEndChat = async () => {
    await chat.endChat()
    router.push('/matchmaking')
  }

  const handleReport = async (reason: string) => {
    console.log('Report:', reason)
    setShowReport(false)
  }

  const handleBlock = async () => {
    console.log('Block user')
  }

  const handleAddFriend = async () => {
    console.log('Add friend')
  }

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
      <ChatHeader
        partnerName={chat.partnerName}
        isOnline={true}
        isTyping={chat.isTyping}
        partnerLeft={chat.partnerLeft}
        chatDuration={chatDuration}
        messageCount={messageCount}
        onReport={() => setShowReport(true)}
        onBlock={handleBlock}
        onAddFriend={handleAddFriend}
        onEndChat={handleEndChat}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
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

        {chat.isTyping && !chat.partnerLeft && (
          <TypingIndicator 
            names={[chat.partnerName]} 
            isVisible={true} 
          />
        )}
      </div>

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
          console.log('Upload:', file)
          setEditImage(null)
        }}
      />
    </div>
  )
}