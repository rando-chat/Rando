/**
 * Supabase Server Client - For use in API routes and Server Components
 * 
 * This client uses the service role key for elevated permissions
 * Use with caution - only in server-side code!
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

/**
 * Create a Supabase client for server-side operations with service role
 * WARNING: This bypasses Row Level Security. Use only when necessary!
 */
export const createServerClient = () => {
  if (!supabaseServiceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This is required for server-side operations.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'rando-chat-server',
      },
    },
  })
}

/**
 * Create a Supabase client for Server Components that respects RLS
 * This uses the user's session from cookies
 */
export const createServerComponentClient = async () => {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const cookieStore = cookies()
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'rando-chat-ssr',
      },
    },
  })
}

/**
 * Get the current session from cookies (for server components)
 */
export const getServerSession = async () => {
  const supabase = await createServerComponentClient()
  
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting server session:', error.message)
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to get server session:', error)
    return null
  }
}

/**
 * Get the current user from the session (for server components)
 */
export const getServerUser = async () => {
  const session = await getServerSession()
  return session?.user ?? null
}
