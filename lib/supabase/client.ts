/**
 * Supabase Client - Typed with exact database schema
 * 
 * This client is configured for client-side usage with full type safety
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

/**
 * Typed Supabase client for client-side operations
 * Includes automatic session persistence and token refresh
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'rando-chat',
      'x-application-version': '1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Type exports for easy access throughout the application
 */
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T]

export type Functions<T extends keyof Database['public']['Functions']> = 
  Database['public']['Functions'][T]

// Convenient type aliases
export type User = Tables<'users'>
export type GuestSession = Tables<'guest_sessions'>
export type ChatSession = Tables<'chat_sessions'>
export type Message = Tables<'messages'>
export type MatchmakingQueueEntry = Tables<'matchmaking_queue'>
export type Report = Tables<'reports'>
export type AuditLog = Tables<'audit_log'>
export type ModerationRule = Tables<'moderation_rules'>
export type Subscription = Tables<'subscriptions'>
export type AnalyticsEvent = Tables<'analytics_events'>

// Enum type aliases
export type UserTier = Enums<'user_tier'>
export type SessionStatus = Enums<'session_status'>
export type ReportStatus = Enums<'report_status'>
export type ModerationAction = Enums<'moderation_action'>
