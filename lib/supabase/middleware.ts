/**
 * Supabase Auth Middleware
 * 
 * Handles authentication state across the application
 * Manages session refresh and guest session validation
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/lib/database.types'

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/profile',
  '/settings',
  '/chat',
  '/matchmaking',
]

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = [
  '/admin',
]

/**
 * Auth routes that should redirect if already authenticated
 */
const AUTH_ROUTES = [
  '/login',
  '/register',
]

/**
 * Check if a path matches any of the given routes
 */
const matchesRoute = (pathname: string, routes: string[]): boolean => {
  return routes.some(route => pathname.startsWith(route))
}

/**
 * Middleware to handle Supabase authentication
 */
export async function supabaseMiddleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Create a Supabase client with the request and response
  const supabase = createMiddlewareClient<Database>({ req: request, res })

  // Refresh session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check for guest session in cookies or headers
  const guestId = request.cookies.get('rando-guest-id')?.value
  const guestToken = request.cookies.get('rando-guest-token')?.value
  
  const hasGuestSession = !!(guestId && guestToken)
  const hasUserSession = !!session

  // Validate guest session if present
  if (hasGuestSession && !hasUserSession) {
    try {
      const { data: validationResult } = await supabase.rpc('validate_guest_session', {
        p_guest_id: guestId,
        p_session_token: guestToken,
      })

      if (validationResult && validationResult.length > 0) {
        const validation = validationResult[0]
        
        // If guest session is invalid or banned, clear cookies
        if (!validation.is_valid || validation.is_banned) {
          const response = NextResponse.redirect(new URL('/', request.url))
          response.cookies.delete('rando-guest-id')
          response.cookies.delete('rando-guest-token')
          response.cookies.delete('rando-guest-name')
          response.cookies.delete('rando-guest-expires')
          return response
        }
      }
    } catch (error) {
      console.error('Guest session validation failed:', error)
      // Continue without blocking - let the app handle it
    }
  }

  // Handle protected routes
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    if (!hasUserSession && !hasGuestSession) {
      // Not authenticated at all - redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Handle admin routes
  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!hasUserSession) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('tier')
      .eq('id', session.user.id)
      .single()

    if (!userData || userData.tier !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Handle auth routes (redirect if already authenticated)
  if (matchesRoute(pathname, AUTH_ROUTES)) {
    if (hasUserSession) {
      return NextResponse.redirect(new URL('/matchmaking', request.url))
    }
  }

  return res
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
