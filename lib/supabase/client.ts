'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: { 'x-application-name': 'rando-chat' },
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// ── Type exports used across the app ──────────────────────────────────────────

export type User = {
  id: string
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  interests?: string[] | null
  tier?: string
  is_banned?: boolean
  ban_reason?: string | null
  report_count?: number
  match_count?: number
  total_chat_time?: string | null
  last_seen_at?: string | null
  student_email?: string | null
  student_email_verified?: boolean
  email_verified?: boolean
  created_at?: string
  updated_at?: string
}

export type GuestSession = {
  id: string
  guest_id: string
  session_token: string
  ip_address?: string | null
  user_agent?: string | null
  country_code?: string | null
  expires_at: string
  created_at?: string
}

export type ChatSession = {
  id: string
  user1_id: string
  user2_id?: string | null
  user1_display_name?: string | null
  user2_display_name?: string | null
  status: string
  shared_interests?: string[] | null
  started_at?: string | null
  ended_at?: string | null
  created_at?: string
}

export type Message = {
  id: string
  session_id: string
  sender_id: string
  sender_display_name?: string | null
  content: string
  is_safe?: boolean
  moderation_score?: number | null
  flagged_reason?: string | null
  delivered?: boolean
  read_by_recipient?: boolean
  edited?: boolean
  created_at?: string
}

export type MatchmakingQueueEntry = {
  id: string
  user_id: string
  is_guest: boolean
  user_tier?: string
  interests?: string[] | null
  min_age?: number | null
  max_age?: number | null
  status: string
  joined_at?: string
  last_ping?: string | null
}

export type Report = {
  id: string
  reporter_id: string
  reported_user_id: string
  session_id?: string | null
  category: string
  reason: string
  evidence?: string | null
  status: string
  action_taken?: string | null
  created_at?: string
}

export type AuditLog = {
  id: string
  admin_id?: string | null
  action_type: string
  resource_type?: string | null
  resource_id?: string | null
  details?: Record<string, unknown> | null
  created_at?: string
}

export type Subscription = {
  id: string
  user_id: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  tier: string
  status: string
  current_period_end?: string | null
  created_at?: string
}

export type AnalyticsEvent = {
  id: string
  user_id?: string | null
  guest_id?: string | null
  event_type: string
  properties?: Record<string, unknown> | null
  created_at?: string
}

export type UserTier = string
export type ReportCategory = string