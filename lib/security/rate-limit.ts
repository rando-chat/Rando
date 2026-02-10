/**
 * Rate Limiting Utilities
 */

import { checkRateLimit } from '@/lib/database/queries'

export async function rateLimitCheck(
  identifier: string,
  action: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number }> {
  const result = await checkRateLimit(identifier, action, limit, windowSeconds)
  
  return {
    success: result.allowed,
    remaining: result.remaining,
  }
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
}
