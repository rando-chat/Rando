/**
 * useRateLimit Hook
 * 
 * Client-side rate limiting integration with database
 */

'use client'

import { useState, useCallback } from 'react'
import { checkRateLimit } from '@/lib/database/queries'

interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetSeconds: number
}

export function useRateLimit() {
  const [status, setStatus] = useState<RateLimitStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const check = useCallback(
    async (
      identifier: string,
      endpoint: string,
      limit: number = 100,
      windowSeconds: number = 60
    ): Promise<RateLimitStatus> => {
      setIsChecking(true)

      try {
        const result = await checkRateLimit(identifier, endpoint, limit, windowSeconds)
        setStatus(result)
        return result
      } catch (error) {
        console.error('Rate limit check failed:', error)
        // Default to allowing on error
        const fallback = { allowed: true, remaining: limit, resetSeconds: windowSeconds }
        setStatus(fallback)
        return fallback
      } finally {
        setIsChecking(false)
      }
    },
    []
  )

  return {
    check,
    status,
    isChecking,
    isRateLimited: status?.allowed === false,
  }
}

/**
 * Hook for rate limiting specific actions
 */
export function useActionRateLimit(
  action: string,
  limit: number = 10,
  windowSeconds: number = 60
) {
  const { check, status, isChecking } = useRateLimit()

  const checkAction = useCallback(
    async (identifier: string) => {
      return await check(identifier, action, limit, windowSeconds)
    },
    [check, action, limit, windowSeconds]
  )

  return {
    checkAction,
    canPerformAction: status?.allowed ?? true,
    remaining: status?.remaining ?? limit,
    resetIn: status?.resetSeconds ?? windowSeconds,
    isChecking,
  }
}
