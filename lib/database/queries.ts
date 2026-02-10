/**
 * Database Query Utilities
 * 
 * Centralized functions for common database operations
 * All functions use proper typing and error handling
 */

import { supabase } from '@/lib/supabase/client'
import type {
  User,
  GuestSession,
  ChatSession,
  Message,
  MatchmakingQueueEntry,
  Report,
  UserTier,
} from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

// ========================================
// USER OPERATIONS
// ========================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Update user's last seen timestamp
 */
export async function updateUserLastSeen(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Error updating last seen:', error)
  }
}

// ========================================
// GUEST SESSION OPERATIONS
// ========================================

/**
 * Create a new guest session using the database function
 */
export async function createGuestSession(options?: {
  ipAddress?: string | null
  userAgent?: string | null
  countryCode?: string | null
}) {
  const { data, error } = await supabase.rpc('create_guest_session', {
    p_ip_address: options?.ipAddress ?? null,
    p_user_agent: options?.userAgent ?? null,
    p_country_code: options?.countryCode ?? null,
  })

  if (error) {
    console.error('Error creating guest session:', error)
    throw new Error('Failed to create guest session')
  }

  if (!data || data.length === 0) {
    throw new Error('No session data returned')
  }

  return data[0]
}

/**
 * Validate a guest session using the database function
 */
export async function validateGuestSession(
  guestId: string,
  sessionToken?: string
) {
  const { data, error } = await supabase.rpc('validate_guest_session', {
    p_guest_id: guestId,
    p_session_token: sessionToken ?? null,
  })

  if (error) {
    console.error('Error validating guest session:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0]
}

/**
 * Get guest session by ID
 */
export async function getGuestSession(guestId: string) {
  const { data, error } = await supabase
    .from('guest_sessions')
    .select('*')
    .eq('id', guestId)
    .single()

  if (error) {
    console.error('Error fetching guest session:', error)
    return null
  }

  return data
}

// ========================================
// MATCHMAKING OPERATIONS
// ========================================

/**
 * Join matchmaking queue
 */
export async function joinMatchmakingQueue(params: {
  userId: string
  isGuest: boolean
  displayName: string
  tier: UserTier
  interests?: string[]
  matchPreferences?: Record<string, any>
}) {
  const { data, error } = await supabase
    .from('matchmaking_queue')
    .upsert({
      user_id: params.userId,
      is_guest: params.isGuest,
      display_name: params.displayName,
      tier: params.tier,
      interests: params.interests ?? [],
      match_preferences: params.matchPreferences ?? { min_age: 18, max_age: 99 },
      entered_at: new Date().toISOString(),
      last_ping_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error joining queue:', error)
    throw new Error('Failed to join matchmaking queue')
  }

  return data
}

/**
 * Leave matchmaking queue
 */
export async function leaveMatchmakingQueue(userId: string, isGuest: boolean) {
  const { error } = await supabase
    .from('matchmaking_queue')
    .delete()
    .eq('user_id', userId)
    .eq('is_guest', isGuest)

  if (error) {
    console.error('Error leaving queue:', error)
    throw new Error('Failed to leave matchmaking queue')
  }
}

/**
 * Find a match using the database function
 */
export async function findMatch(params: {
  userId: string
  isGuest: boolean
  userTier: UserTier
  userInterests: string[]
  minAge?: number
  maxAge?: number
}) {
  const { data, error } = await supabase.rpc('match_users_v2', {
    p_user_id: params.userId,
    p_is_guest: params.isGuest,
    p_user_tier: params.userTier,
    p_user_interests: params.userInterests,
    p_min_age: params.minAge ?? 18,
    p_max_age: params.maxAge ?? 99,
  })

  if (error) {
    console.error('Error finding match:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0]
}

/**
 * Update queue ping timestamp
 */
export async function updateQueuePing(userId: string, isGuest: boolean) {
  const { error } = await supabase
    .from('matchmaking_queue')
    .update({ last_ping_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_guest', isGuest)

  if (error) {
    console.error('Error updating queue ping:', error)
  }
}

// ========================================
// CHAT OPERATIONS
// ========================================

/**
 * Create a new chat session
 */
export async function createChatSession(params: {
  user1Id: string
  user2Id: string
  user1IsGuest: boolean
  user2IsGuest: boolean
  user1DisplayName: string
  user2DisplayName: string
  sharedInterests?: string[]
  matchScore?: number
}) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user1_id: params.user1Id,
      user2_id: params.user2Id,
      user1_is_guest: params.user1IsGuest,
      user2_is_guest: params.user2IsGuest,
      user1_display_name: params.user1DisplayName,
      user2_display_name: params.user2DisplayName,
      shared_interests: params.sharedInterests ?? [],
      match_score: params.matchScore ?? 50,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating chat session:', error)
    throw new Error('Failed to create chat session')
  }

  return data
}

/**
 * Get chat session by ID
 */
export async function getChatSession(sessionId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching chat session:', error)
    return null
  }

  return data
}

/**
 * End a chat session
 */
export async function endChatSession(
  sessionId: string,
  userId: string,
  reason?: string
) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      ended_by: userId,
      end_reason: reason ?? 'User ended chat',
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error ending chat session:', error)
    throw new Error('Failed to end chat session')
  }

  return data
}

// ========================================
// MESSAGE OPERATIONS
// ========================================

/**
 * Send a message (will be auto-moderated by trigger)
 */
export async function sendMessage(params: {
  sessionId: string
  senderId: string
  senderIsGuest: boolean
  senderDisplayName: string
  content: string
}) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: params.sessionId,
      sender_id: params.senderId,
      sender_is_guest: params.senderIsGuest,
      sender_display_name: params.senderDisplayName,
      content: params.content,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }

  return data
}

/**
 * Get messages for a chat session
 */
export async function getChatMessages(sessionId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data
}

/**
 * Check content safety before sending
 */
export async function checkContentSafety(
  content: string,
  userId?: string,
  isGuest?: boolean
) {
  const { data, error } = await supabase.rpc('check_content_advanced', {
    p_content: content,
    p_user_id: userId ?? null,
    p_is_guest: isGuest ?? false,
  })

  if (error) {
    console.error('Error checking content safety:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0]
}

// ========================================
// REPORT OPERATIONS
// ========================================

/**
 * Submit a user report using the database function
 */
export async function submitUserReport(params: {
  reporterId: string
  reporterIsGuest: boolean
  reportedUserId: string
  reportedUserIsGuest: boolean
  sessionId: string
  reason: string
  category: string
  evidence?: Record<string, any>
}) {
  const { data, error } = await supabase.rpc('handle_user_report', {
    p_reporter_id: params.reporterId,
    p_reporter_is_guest: params.reporterIsGuest,
    p_reported_user_id: params.reportedUserId,
    p_reported_user_is_guest: params.reportedUserIsGuest,
    p_session_id: params.sessionId,
    p_reason: params.reason,
    p_category: params.category as any,
    p_evidence: params.evidence ?? {},
  })

  if (error) {
    console.error('Error submitting report:', error)
    throw new Error('Failed to submit report')
  }

  if (!data || data.length === 0) {
    throw new Error('No report data returned')
  }

  return data[0]
}

/**
 * Get user's reports
 */
export async function getUserReports(userId: string, isGuest: boolean) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('reporter_id', userId)
    .eq('reporter_is_guest', isGuest)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return []
  }

  return data
}

// ========================================
// ANALYTICS OPERATIONS
// ========================================

/**
 * Track an analytics event
 */
export async function trackEvent(params: {
  eventType: string
  userId?: string
  userIsGuest?: boolean
  sessionId?: string
  properties?: Record<string, any>
}) {
  const { error } = await supabase.from('analytics_events').insert({
    event_type: params.eventType,
    user_id: params.userId ?? null,
    user_is_guest: params.userIsGuest ?? false,
    session_id: params.sessionId ?? null,
    properties: params.properties ?? {},
  })

  if (error) {
    console.error('Error tracking event:', error)
  }
}

// ========================================
// RATE LIMITING
// ========================================

/**
 * Check if action is rate limited
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 100,
  windowSeconds: number = 60
) {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_endpoint: endpoint,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('Error checking rate limit:', error)
    return { allowed: true, remaining: limit, reset_seconds: windowSeconds }
  }

  if (!data || data.length === 0) {
    return { allowed: true, remaining: limit, reset_seconds: windowSeconds }
  }

  return data[0]
}
