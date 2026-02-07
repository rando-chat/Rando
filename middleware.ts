// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { securityHeaders, apiSecurityHeaders } from '@/lib/middleware/security-headers'

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Apply API-specific headers for API routes
  if (path.startsWith('/api/')) {
    return apiSecurityHeaders(request)
  }

  // Apply regular security headers for all other routes
  return securityHeaders(request)
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}