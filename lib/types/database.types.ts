// lib/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string
          original_display_name: string | null
          tier: 'free' | 'student' | 'premium' | 'admin'
          interests: string[] | null
          bio: string | null
          avatar_url: string | null
          location: string | null
          age: number | null
          email_verified: boolean
          student_email: string | null
          student_email_verified: boolean
          is_banned: boolean
          ban_reason: string | null
          ban_expires_at: string | null
          report_count: number
          last_report_at: string | null
          match_count: number
          total_chat_time: string | null
          created_at: string
          updated_at: string
          last_seen_at: string
        }
        Insert: {
          id: string
          display_name?: string
          original_display_name?: string | null
          tier?: 'free' | 'student' | 'premium' | 'admin'
          interests?: string[] | null
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          age?: number | null
          email_verified?: boolean
          student_email?: string | null
          student_email_verified?: boolean
          is_banned?: boolean
          ban_reason?: string | null
          ban_expires_at?: string | null
          report_count?: number
          last_report_at?: string | null
          match_count?: number
          total_chat_time?: string | null
          created_at?: string
          updated_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          original_display_name?: string | null
          tier?: 'free' | 'student' | 'premium' | 'admin'
          interests?: string[] | null
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          age?: number | null
          email_verified?: boolean
          student_email?: string | null
          student_email_verified?: boolean
          is_banned?: boolean
          ban_reason?: string | null
          ban_expires_at?: string | null
          report_count?: number
          last_report_at?: string | null
          match_count?: number
          total_chat_time?: string | null
          created_at?: string
          updated_at?: string
          last_seen_at?: string
        }
      }
      guest_sessions: {
        Row: {
          id: string
          display_name: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          country_code: string | null
          is_banned: boolean
          ban_reason: string | null
          report_count: number
          match_count: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          display_name: string
          session_token: string
          ip_address?: string | null
          user_agent?: string | null
          country_code?: string | null
          is_banned?: boolean
          ban_reason?: string | null
          report_count?: number
          match_count?: number
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          session_token?: string
          ip_address?: string | null
          user_agent?: string | null
          country_code?: string | null
          is_banned?: boolean
          ban_reason?: string | null
          report_count?: number
          match_count?: number
          created_at?: string
          expires_at?: string
        }
      }
      // ... add other table types as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_content_advanced: {
        Args: {
          p_content: string
          p_user_id?: string
          p_is_guest?: boolean
        }
        Returns: {
          is_safe: boolean
          safety_score: number
          flagged_reasons: string[]
          suggested_action: string
          confidence: number
        }[]
      }
      create_guest_session: {
        Args: {
          p_ip_address?: string
          p_user_agent?: string
          p_country_code?: string
        }
        Returns: {
          guest_id: string
          session_token: string
          display_name: string
          expires_at: string
        }[]
      }
      generate_display_name: {
        Args: {
          p_gender_preference?: string
        }
        Returns: string
      }
      handle_user_report: {
        Args: {
          p_reporter_id: string
          p_reporter_is_guest: boolean
          p_reported_user_id: string
          p_reported_user_is_guest: boolean
          p_session_id: string
          p_reason: string
          p_category: string
          p_evidence: Json
        }
        Returns: {
          report_id: string
          success: boolean
          message: string
          cooldown_remaining: number
        }[]
      }
      match_users_v2: {
        Args: {
          p_user_id: string
          p_is_guest: boolean
          p_user_tier: Database['public']['Enums']['user_tier']
          p_user_interests: string[]
          p_min_age?: number
          p_max_age?: number
        }
        Returns: {
          match_user_id: string
          match_is_guest: boolean
          match_display_name: string
          match_tier: Database['public']['Enums']['user_tier']
          match_score: number
          shared_interests: string[]
          estimated_wait_time: number
        }[]
      }
      cleanup_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      user_tier: 'free' | 'student' | 'premium' | 'admin'
      session_status: 'waiting' | 'active' | 'ended' | 'reported' | 'banned'
      report_status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
      moderation_action: 'warn' | 'mute' | 'ban_temporary' | 'ban_permanent' | 'escalate'
    }
  }
}

// Custom types for the application
export type UserTier = Database['public']['Enums']['user_tier']
export type SessionStatus = Database['public']['Enums']['session_status']
export type ReportStatus = Database['public']['Enums']['report_status']
export type ModerationAction = Database['public']['Enums']['moderation_action']

// Chat message type
export interface ChatMessage {
  id: string
  session_id: string
  sender_id: string
  sender_is_guest: boolean
  sender_display_name: string
  content: string
  content_hash: string
  is_safe: boolean
  moderation_score: number
  moderated_by: string | null
  flagged_reason: string | null
  edited: boolean
  original_content: string | null
  read_by_recipient: boolean
  delivered: boolean
  created_at: string
}

// Matchmaking result type
export interface MatchmakingResult {
  match_user_id: string | null
  match_is_guest: boolean | null
  match_display_name: string | null
  match_tier: UserTier | null
  match_score: number | null
  shared_interests: string[] | null
  estimated_wait_time: number
}

// Guest session type
export interface GuestSession {
  guest_id: string
  session_token: string
  display_name: string
  expires_at: string
}