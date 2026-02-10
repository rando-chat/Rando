import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { usePresence } from './useRealtime'

export function useTyping(sessionId: string, userId: string) {
  const { onlineUsers, updatePresence } = usePresence(`chat:${sessionId}`, userId)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const partnerTyping = onlineUsers.some((u: any) => u.user_id !== userId && u.typing === true)

  const startTyping = () => {
    updatePresence({ typing: true })
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      updatePresence({ typing: false })
    }, 3000)
  }

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    updatePresence({ typing: false })
  }

  return { isTyping: partnerTyping, startTyping, stopTyping }
}
