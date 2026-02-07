// app/providers.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/components/auth/AuthProvider'

// Create a context for user session
interface UserContextType {
  user: any | null
  isLoading: boolean
  isGuest: boolean
  guestSession: any | null
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  isGuest: false,
  guestSession: null,
})

export function useUser() {
  return useContext(UserContext)
}

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [guestSession, setGuestSession] = useState<any | null>(null)

  useEffect(() => {
    // Check for existing auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setIsGuest(false)
      } else {
        // Check for guest session in localStorage
        const guestData = localStorage.getItem('rando-chat-guest-session')
        if (guestData) {
          try {
            const session = JSON.parse(guestData)
            if (new Date(session.expires_at) > new Date()) {
              setGuestSession(session)
              setIsGuest(true)
            } else {
              localStorage.removeItem('rando-chat-guest-session')
            }
          } catch {
            localStorage.removeItem('rando-chat-guest-session')
          }
        }
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null)
          setIsGuest(false)
          setGuestSession(null)
          localStorage.removeItem('rando-chat-guest-session')
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsGuest(false)
          setGuestSession(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ user, isLoading, isGuest, guestSession }}>
      {children}
    </UserContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </UserProvider>
  )
}