import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getChatSession, getChatMessages, sendMessage as dbSendMessage, endChatSession } from '@/lib/database/queries'
import { useChatMessages } from './useRealtime'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Message, ChatSession } from '@/lib/supabase/client'

export function useChat(sessionId: string) {
  const { getUserId, isGuest, getDisplayName } = useAuth()
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    loadChatData()
  }, [sessionId])

  useChatMessages(sessionId, (newMessage) => {
    setMessages(prev => [...prev, newMessage as Message])
  })

  const loadChatData = async () => {
    try {
      const [sessionData, messagesData] = await Promise.all([
        getChatSession(sessionId),
        getChatMessages(sessionId, 50)
      ])
      setSession(sessionData)
      setMessages(messagesData)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (content: string) => {
    setIsSending(true)
    try {
      const result = await dbSendMessage({
        sessionId,
        senderId: getUserId()!,
        senderIsGuest: isGuest,
        senderDisplayName: getDisplayName(),
        content,
      })
      return result
    } finally {
      setIsSending(false)
    }
  }

  const endChat = async () => {
    const userId = getUserId()
    if (!userId) return
    await endChatSession(sessionId, userId, 'User ended chat')
  }

  return { session, messages, isLoading, error, sendMessage, endChat, isSending }
}
