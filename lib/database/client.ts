// lib/database/client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database.types'

// These will be set by Vercel environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate environment variables in production
if (process.env.NODE_ENV === 'production') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!')
    throw new Error('Missing Supabase credentials')
  }
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'rando-chat'
    }
  }
})

// Helper to check if user is authenticated
export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }
  
  return session.user
}

// Helper to check if guest session is valid
export async function validateGuestSession(guestId: string, sessionToken: string) {
  try {
    const { data, error } = await supabase.rpc('validate_guest_session', {
      p_guest_id: guestId,
      p_session_token: sessionToken
    })

    if (error) throw error
    
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Guest validation error:', error)
    return null
  }
}