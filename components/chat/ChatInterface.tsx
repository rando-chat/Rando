'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/hooks/useChat'
import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

interface ChatInterfaceProps {
  sessionId: string
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    session,
    guestSession,
    messages,
    isLoading,
    error,
    sendMessage,
    endChat,
    isSending,
  } = useChat(sessionId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  const handleEndChat = async () => {
    await endChat()
    router.push('/matchmaking')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || !session || !guestSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load chat session</p>
          <button
            onClick={() => router.push('/matchmaking')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Return to Matchmaking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      <ChatHeader 
        session={session}
        guestSession={guestSession}
        onEndChat={handleEndChat}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <p>No messages yet</p>
            <p className="text-sm">Say hi to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === guestSession.guest_id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        isSending={isSending}
        sessionId={sessionId}
        guestSession={guestSession}
      />
    </div>
  )
}