import { useState, useEffect } from 'react'
import { getChatMessages } from '@/lib/database/queries'
import type { Message } from '@/lib/supabase/client'

export function useMessages(sessionId: string, limit: number = 50) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [sessionId])

  const loadMessages = async () => {
    setIsLoading(true)
    const data = await getChatMessages(sessionId, limit)
    setMessages(data)
    setHasMore(data.length === limit)
    setIsLoading(false)
  }

  const loadMore = async () => {
    const oldestMessage = messages[0]
    if (!oldestMessage) return
    // Load more logic here
  }

  return { messages, isLoading, hasMore, loadMore }
}
