/**
 * Authentication Guard Component
 * 
 * Protects routes and components from unauthorized access
 * Supports both user and guest authentication
 */

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  requireUser?: boolean // Require registered user (not guest)
  requireAdmin?: boolean // Require admin access
  fallback?: React.ReactNode // Show while loading
  redirectTo?: string // Where to redirect if not authenticated
}

export function AuthGuard({
  children,
  requireUser = false,
  requireAdmin = false,
  fallback,
  redirectTo = '/',
}: AuthGuardProps) {
  const {
    isLoading,
    isAuthenticated,
    isGuest,
    isAdmin,
    user,
  } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (isLoading) return

    // Check if authenticated at all
    if (!isAuthenticated) {
      router.push(redirectTo)
      return
    }

    // Check if requires registered user (no guests)
    if (requireUser && isGuest) {
      router.push('/login?message=Please login to continue')
      return
    }

    // Check if requires admin
    if (requireAdmin && !isAdmin) {
      router.push('/?message=Unauthorized access')
      return
    }

    setIsAuthorized(true)
  }, [
    isLoading,
    isAuthenticated,
    isGuest,
    isAdmin,
    requireUser,
    requireAdmin,
    router,
    redirectTo,
  ])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        {fallback || (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return <>{children}</>
}

/**
 * Higher-order component version of AuthGuard
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}
