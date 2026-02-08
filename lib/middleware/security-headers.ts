// lib/middleware/security-headers.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function securityHeaders(request: NextRequest) {
  // Clone the response to add headers
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // CSP Header (Content Security Policy)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  
  // Feature Policy / Permissions Policy
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()'
  ].join(', ')

  response.headers.set('Permissions-Policy', permissionsPolicy)

  // XSS Protection (legacy but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Expect-CT (Certificate Transparency)
  response.headers.set('Expect-CT', 'max-age=86400, enforce')

  // Remove server information
  response.headers.delete('x-powered-by')
  response.headers.delete('server')

  return response
}

// API-specific security headers
export function apiSecurityHeaders(request: NextRequest) {
  const response = NextResponse.next()

  // All security headers
  securityHeaders(request)

  // Additional API headers
  response.headers.set('Access-Control-Allow-Origin', 
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info')
  response.headers.set('Access-Control-Max-Age', '86400')
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  // Rate limit headers (will be added by rate limiting middleware)
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', '99')
  response.headers.set('X-RateLimit-Reset', '60')

  return response
}

// Security middleware for Next.js
export function withSecurityHeaders(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const response = await handler(request, ...args)
    
    // Add security headers to the response
    securityHeaders(request)
    
    return response
  }
}