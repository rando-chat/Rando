'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { sessionManager } from '@/lib/auth/session'
import { logError } from '@/lib/utils/logger'

interface AuthContextType {
  user: any | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, displayName?: string) => Promise<any>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  createGuestSession: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
    
    // Set up session refresh interval
    const interval = setInterval(checkAuth, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [])

  const checkAuth = async () => {
    try {
      const session = await sessionManager.getCurrentSession()
      setUser(session)
    } catch (error) {
      logError('AuthProvider', 'Failed to check auth status', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await sessionManager.signIn(email, password)
      if (result.success && result.user) {
        setUser(result.user)
      }
      return result
    } catch (error) {
      logError('AuthProvider', 'Sign in failed', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true)
    try {
      const result = await sessionManager.signUp(email, password, displayName)
      if (result.success && result.user) {
        setUser(result.user)
      }
      return result
    } catch (error) {
      logError('AuthProvider', 'Sign up failed', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      if (user) {
        await sessionManager.signOut(user.id)
      }
      setUser(null)
      router.push('/')
    } catch (error) {
      logError('AuthProvider', 'Sign out failed', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      await checkAuth()
    } catch (error) {
      logError('AuthProvider', 'Session refresh failed', error)
    }
  }

  const createGuestSession = async () => {
    setIsLoading(true)
    try {
      const result = await sessionManager.createGuestSession()
      if (result.success && result.session) {
        setUser(result.session)
      }
      return result
    } catch (error) {
      logError('AuthProvider', 'Guest session creation failed', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !user.isGuest,
    isGuest: !!user && user.isGuest,
    signIn,
    signUp,
    signOut,
    refreshSession,
    createGuestSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher Order Component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean
    requireGuest?: boolean
    redirectTo?: string
  }
) {
  return function WithAuthComponent(props: P) {
    const auth = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (auth.isLoading) return

      if (options?.requireAuth && !auth.isAuthenticated) {
        router.push(options.redirectTo || '/auth/login')
      }

      if (options?.requireGuest && !auth.isGuest) {
        router.push(options.redirectTo || '/chat')
      }
    }, [auth.isLoading, auth.isAuthenticated, auth.isGuest, router])

    if (auth.isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      )
    }

    if (options?.requireAuth && !auth.isAuthenticated) {
      return null // Will redirect in useEffect
    }

    if (options?.requireGuest && !auth.isGuest) {
      return null // Will redirect in useEffect
    }

    return <Component {...props} />
  }
}