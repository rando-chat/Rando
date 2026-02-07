// lib/database/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

// Environment variables (will be set in .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client with enhanced configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'rando-chat'
    }
  }
})

// Helper function to get session with retry logic
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Helper to get user ID (works for both registered and guest users)
export async function getUserId() {
  const session = await getSession()
  if (session?.user) {
    return session.user.id
  }
  
  // Check for guest session in localStorage
  if (typeof window !== 'undefined') {
    const guestSession = localStorage.getItem('rando-chat-guest-session')
    if (guestSession) {
      try {
        const { guest_id } = JSON.parse(guestSession)
        return guest_id
      } catch {
        return null
      }
    }
  }
  
  return null
}

// Subscribe to realtime changes
export function subscribeToChannel(
  channel: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(channel)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: channel },
      callback
    )
    .subscribe()
}