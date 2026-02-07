// components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUser } from '@/app/providers'

interface AuthContextType {
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  userId: string | null
  displayName: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isGuest, guestSession } = useUser()

  const value: AuthContextType = {
    isAuthenticated: !isLoading && (!!user || !!guestSession),
    isGuest,
    isLoading,
    userId: user?.id || guestSession?.guest_id || null,
    displayName: user?.user_metadata?.display_name || guestSession?.display_name || null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}