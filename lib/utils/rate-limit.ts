// lib/utils/rate-limit.ts

interface RateLimitConfig {
  limit: number
  window: number // in seconds
  identifier: string
}

class MemoryStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every hour
    this.cleanupInterval = setInterval(() => this.cleanup(), 3600000)
  }

  async increment(key: string, window: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const resetTime = now + window * 1000

    const entry = this.store.get(key)
    
    if (!entry || now > entry.resetTime) {
      // New window
      const newEntry = { count: 1, resetTime }
      this.store.set(key, newEntry)
      return newEntry
    }

    // Increment existing window
    entry.count += 1
    return entry
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    return this.store.get(key) || null
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Singleton instance
const memoryStore = new MemoryStore()

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated service
 */
export async function rateLimit({
  limit,
  window,
  identifier
}: RateLimitConfig): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const key = `rate-limit:${identifier}`
  const result = await memoryStore.increment(key, window)

  const remaining = Math.max(0, limit - result.count)
  const reset = Math.ceil((result.resetTime - Date.now()) / 1000)

  return {
    success: result.count <= limit,
    limit,
    remaining,
    reset
  }
}

/**
 * Get client identifier (IP or user ID)
 */
export function getClientIdentifier(request: Request): string {
  try {
    // Try to get IP from headers (vercel/next.js)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'anonymous'
    
    return ip
  } catch {
    return 'anonymous'
  }
}

/**
 * Rate limit by user ID (for authenticated users)
 */
export function getUserIdentifier(userId?: string): string {
  return userId ? `user:${userId}` : 'anonymous'
}

/**
 * Check rate limit and set headers
 */
export async function checkRateLimit(
  request: Request,
  limit: number = 10,
  window: number = 60
): Promise<{
  success: boolean
  headers?: Headers
  message?: string
}> {
  const identifier = getClientIdentifier(request)
  const result = await rateLimit({ limit, window, identifier })

  const headers = new Headers()
  headers.set('X-RateLimit-Limit', limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.reset.toString())

  if (!result.success) {
    return {
      success: false,
      headers,
      message: `Rate limit exceeded. Try again in ${result.reset} seconds.`
    }
  }

  return {
    success: true,
    headers
  }
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Strict limits for sensitive operations
  AUTH: {
    login: { limit: 5, window: 300 }, // 5 attempts per 5 minutes
    register: { limit: 3, window: 3600 }, // 3 per hour
    passwordReset: { limit: 3, window: 3600 }
  },
  
  // Moderate limits for chat operations
  CHAT: {
    sendMessage: { limit: 60, window: 60 }, // 60 messages per minute
    createSession: { limit: 10, window: 300 } // 10 sessions per 5 minutes
  },
  
  // Generous limits for read operations
  READ: {
    getMessages: { limit: 100, window: 60 }, // 100 requests per minute
    getProfile: { limit: 30, window: 60 }
  },
  
  // Strict limits for reporting
  MODERATION: {
    createReport: { limit: 5, window: 3600 } // 5 reports per hour
  }
} as const