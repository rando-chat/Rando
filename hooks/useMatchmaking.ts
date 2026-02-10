import { useState, useEffect, useCallback } from 'react'
import { joinMatchmakingQueue, leaveMatchmakingQueue, findMatch } from '@/lib/database/queries'
import { useAuth } from '@/components/auth/AuthProvider'
import type { UserTier } from '@/lib/database.types'

export function useMatchmaking() {
  const { getUserId, isGuest } = useAuth()
  const [isInQueue, setIsInQueue] = useState(false)
  const [queuePosition, setQueuePosition] = useState(0)
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [matchFound, setMatchFound] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isInQueue) {
      interval = setInterval(checkForMatch, 3000)
    }
    return () => clearInterval(interval)
  }, [isInQueue])

  const checkForMatch = async () => {
    const userId = getUserId()
    if (!userId) return

    const match = await findMatch({
      userId,
      isGuest,
      userTier: 'free' as UserTier,
      userInterests: [],
    })

    if (match?.match_user_id) {
      setMatchFound(match)
      setIsInQueue(false)
    } else {
      setEstimatedWait(match?.estimated_wait_time || 30)
      setQueuePosition(Math.floor(Math.random() * 10) + 1)
    }
  }

  const joinQueue = async (params: any) => {
    setIsLoading(true)
    await joinMatchmakingQueue(params)
    setIsInQueue(true)
    setIsLoading(false)
  }

  const leaveQueue = async () => {
    const userId = getUserId()
    if (!userId) return
    await leaveMatchmakingQueue(userId, isGuest)
    setIsInQueue(false)
  }

  return { isInQueue, queuePosition, estimatedWait, matchFound, joinQueue, leaveQueue, isLoading }
}
