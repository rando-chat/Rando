import { useEffect, useState } from 'react'
import { useMatchmakingQueue } from './useRealtime'

export function useQueueStatus(userId: string, isGuest: boolean) {
  const [position, setPosition] = useState(0)
  const [estimatedWait, setEstimatedWait] = useState(30)

  useMatchmakingQueue(userId, isGuest, (match) => {
    if (match.matched_at) {
      window.location.href = `/chat/${match.session_id}`
    }
  })

  return { position, estimatedWait }
}
