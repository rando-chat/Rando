/**
 * Authentication Provider
 * 
 * Complete authentication context handling both:
 * - Guest sessions (24-hour temporary)
 * - Registered user sessions (permanent with Supabase Auth)
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { User as DBUser, GuestSession } from '@/lib/supabase/client'
import { validateGuestSession, getUserProfile, updateUserLastSeen } from '@/lib/database/queries'

// ========================================
// TYPES
// ========================================

interface GuestSessionData {
  id: string
  displayName: string
  sessionToken: string
  expiresAt: string
}

interface AuthContextType {
  // User state
  user: User | null
  dbUser: DBUser | null
  guestSession: GuestSessionData | null
  
  // Status flags
  isLoading: boolean
  isGuest: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isBanned: boolean
  
  // Actions
  signOut: () => Promise<void>
  refreshGuestSession: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  
  // Getters
  getUserId: () => string | null
  getDisplayName: () => string
  getUserTier: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ========================================
// GUEST SESSION STORAGE KEYS
// ========================================

const GUEST_KEYS = {
  ID: 'rando-guest-id',
  TOKEN: 'rando-guest-token',
  NAME: 'rando-guest-name',
  EXPIRES: 'rando-guest-expires',
} as const

// ========================================
// PROVIDER COMPONENT
// ========================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<DBUser | null>(null)
  const [guestSession, setGuestSession] = useState<GuestSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ========================================
  // GUEST SESSION MANAGEMENT
  // ========================================

  const loadGuestSession = useCallback(() => {
    if (typeof window === 'undefined') return null

    const guestId = localStorage.getItem(GUEST_KEYS.ID)
    const guestToken = localStorage.getItem(GUEST_KEYS.TOKEN)
    const guestName = localStorage.getItem(GUEST_KEYS.NAME)
    const guestExpires = localStorage.getItem(GUEST_KEYS.EXPIRES)

    if (!guestId || !guestToken || !guestName || !guestExpires) {
      return null
    }

    // Check if expired
    if (new Date(guestExpires) <= new Date()) {
      clearGuestSession()
      return null
    }

    return {
      id: guestId,
      sessionToken: guestToken,
      displayName: guestName,
      expiresAt: guestExpires,
    }
  }, [])

  const clearGuestSession = useCallback(() => {
    if (typeof window === 'undefined') return

    localStorage.removeItem(GUEST_KEYS.ID)
    localStorage.removeItem(GUEST_KEYS.TOKEN)
    localStorage.removeItem(GUEST_KEYS.NAME)
    localStorage.removeItem(GUEST_KEYS.EXPIRES)
    setGuestSession(null)
  }, [])

  const refreshGuestSession = useCallback(async () => {
    const session = loadGuestSession()
    if (!session) return

    try {
      const validation = await validateGuestSession(session.id, session.sessionToken)

      if (!validation || !validation.is_valid || validation.is_banned) {
        clearGuestSession()
        return
      }

      setGuestSession(session)
    } catch (error) {
      console.error('Failed to validate guest session:', error)
      clearGuestSession()
    }
  }, [loadGuestSession, clearGuestSession])

  // ========================================
  // USER SESSION MANAGEMENT
  // ========================================

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await getUserProfile(userId)
      setDbUser(profile)
      
      // Update last seen
      await updateUserLastSeen(userId)
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }, [])

  const refreshUserProfile = useCallback(async () => {
    if (!user) return
    await loadUserProfile(user.id)
  }, [user, loadUserProfile])

  // ========================================
  // AUTHENTICATION STATE
  // ========================================

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        // Check for Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          // No user session, check for guest session
          const guest = loadGuestSession()
          if (guest && mounted) {
            setGuestSession(guest)
            await refreshGuestSession()
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
        // Clear guest session if switching to user
        clearGuestSession()
      } else {
        setUser(null)
        setDbUser(null)
        // Check for guest session
        const guest = loadGuestSession()
        if (guest) {
          setGuestSession(guest)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadGuestSession, loadUserProfile, refreshGuestSession, clearGuestSession])

  // Refresh guest session periodically
  useEffect(() => {
    if (!guestSession) return

    const interval = setInterval(() => {
      refreshGuestSession()
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(interval)
  }, [guestSession, refreshGuestSession])

  // ========================================
  // ACTIONS
  // ========================================

  const signOut = useCallback(async () => {
    try {
      if (user) {
        await supabase.auth.signOut()
      }
      clearGuestSession()
      setUser(null)
      setDbUser(null)
      
      // Redirect to home
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [user, clearGuestSession])

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const isGuest = !!guestSession && !user
  const isAuthenticated = !!user || !!guestSession
  const isAdmin = dbUser?.tier === 'admin'
  const isBanned = dbUser?.is_banned ?? false

  const getUserId = useCallback(() => {
    if (user) return user.id
    if (guestSession) return guestSession.id
    return null
  }, [user, guestSession])

  const getDisplayName = useCallback(() => {
    if (dbUser) return dbUser.display_name
    if (guestSession) return guestSession.displayName
    return 'Anonymous'
  }, [dbUser, guestSession])

  const getUserTier = useCallback(() => {
    if (dbUser) return dbUser.tier
    return 'free'
  }, [dbUser])

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value: AuthContextType = {
    user,
    dbUser,
    guestSession,
    isLoading,
    isGuest,
    isAuthenticated,
    isAdmin,
    isBanned,
    signOut,
    refreshGuestSession,
    refreshUserProfile,
    getUserId,
    getDisplayName,
    getUserTier,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ========================================
// HOOK
// ========================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ========================================
// UTILITY HOOKS
// ========================================

/**
 * Hook to require authentication (redirect if not authenticated)
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/'
    }
  }, [isAuthenticated, isLoading])

  return { isLoading, isAuthenticated }
}

/**
 * Hook to require admin access
 */
export function useRequireAdmin() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      window.location.href = '/'
    }
  }, [isAdmin, isLoading, isAuthenticated])

  return { isLoading, isAdmin }
}

/**
 * Hook to check if user is banned
 */
export function useCheckBanned() {
  const { isBanned, isLoading, signOut } = useAuth()

  useEffect(() => {
    if (!isLoading && isBanned) {
      alert('Your account has been banned. You will be logged out.')
      signOut()
    }
  }, [isBanned, isLoading, signOut])

  return { isBanned }
}
