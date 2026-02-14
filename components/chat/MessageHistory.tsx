'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageBubble } from './MessageBubble'
import type { Message } from '@/lib/supabase/client'

interface MessageHistoryProps {
  messages: Message[]
  currentUserId: string | null
  onLoadMore?: () => void
  hasMore?: boolean
}

export function MessageHistory({ messages, currentUserId, onLoadMore, hasMore }: MessageHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isNearTop, setIsNearTop] = useState(false)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop } = scrollRef.current
      setIsNearTop(scrollTop < 100)
    }
  }

  useEffect(() => {
    if (isNearTop && hasMore && onLoadMore) {
      onLoadMore()
    }
  }, [isNearTop, hasMore, onLoadMore])

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
      {hasMore && (
        <div className="text-center">
          <button onClick={onLoadMore} className="text-purple-600 text-sm">Load more</button>
        </div>
      )}
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === currentUserId} />
      ))}
    </div>
  )
}