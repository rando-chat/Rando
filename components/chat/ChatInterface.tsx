/**
 * ChatInterface Component
 * 
 * Main chat interface with real-time messaging
 * Integrates with Supabase Realtime for live updates
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useChatMessages } from '@/hooks/useRealtime'
import { useChat } from '@/hooks/useChat'
import { useTyping } from '@/hooks/useTyping'
import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { SafetyWarning } from './SafetyWarning'
import type { Message, ChatSession } from '@/lib/supabase/client'

interface ChatInterfaceProps {
  sessionId: string
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const { getUserId, isGuest } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    session,
    messages,
    isLoading: chatLoading,
    error: chatError,
    sendMessage,
    endChat,
    isSending,
  } = useChat(sessionId)

  const {
    isTyping: partnerTyping,
    startTyping,
    stopTyping,
  } = useTyping(sessionId, getUserId() || '')

  const [unsafeMessage, setUnsafeMessage] = useState<string | null>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    const result = await sendMessage(content)
    
    if (result && !result.is_safe) {
      setUnsafeMessage(result.flagged_reason || 'Message flagged for review')
      setTimeout(() => setUnsafeMessage(null), 5000)
    }
  }

  const handleTypingStart = () => {
    startTyping()
  }

  const handleTypingStop = () => {
    stopTyping()
  }

  if (chatLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (chatError || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load chat session</p>
          <button
            onClick={() => window.location.href = '/matchmaking'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Return to Matchmaking
          </button>
        </div>
      </div>
    )
  }

  const currentUserId = getUserId()
  const isUser1 = session.user1_id === currentUserId && !isGuest
  const partnerName = isUser1 ? session.user2_display_name : session.user1_display_name

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Chat Header */}
      <ChatHeader
        session={session}
        partnerName={partnerName}
        onEndChat={endChat}
      />

      {/* Safety Warning */}
      {unsafeMessage && (
        <SafetyWarning message={unsafeMessage} />
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isCurrentUser={message.sender_id === currentUserId}
          />
        ))}

        {/* Typing Indicator */}
        {partnerTyping && (
          <TypingIndicator displayName={partnerName} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        disabled={session.status !== 'active' || isSending}
        sessionStatus={session.status}
      />
    </div>
  )
}
