/**
 * Database Types - AUTO-GENERATED FROM SUPABASE SCHEMA
 * 
 * This file contains TypeScript interfaces that EXACTLY match the database schema.
 * 
 * To regenerate: npm run db:types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ========================================
// ENUMS (matching exact database enums)
// ========================================

export type UserTier = 'free' | 'student' | 'premium' | 'admin'
export type SessionStatus = 'waiting' | 'active' | 'ended' | 'reported' | 'banned'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
export type ModerationAction = 'warn' | 'mute' | 'ban_temporary' | 'ban_permanent' | 'escalate'
export type ReportCategory = 
  | 'harassment' 
  | 'hate_speech' 
  | 'spam' 
  | 'inappropriate_content' 
  | 'underage' 
  | 'sharing_personal_info' 
  | 'threats' 
  | 'other'

// ========================================
// DATABASE SCHEMA
// ========================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string
          original_display_name: string | null
          tier: UserTier
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
          total_chat_time: string // interval type
          created_at: string
          updated_at: string
          last_seen_at: string
        }
        Insert: {
          id: string
          display_name?: string
          original_display_name?: string | null
          tier?: UserTier
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
          total_chat_time?: string
          created_at?: string
          updated_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          original_display_name?: string | null
          tier?: UserTier
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
          total_chat_time?: string
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
      chat_sessions: {
        Row: {
          id: string
          user1_id: string | null
          user2_id: string | null
          user1_is_guest: boolean
          user2_is_guest: boolean
          user1_display_name: string
          user2_display_name: string
          status: SessionStatus
          shared_interests: string[] | null
          match_score: number | null
          started_at: string
          ended_at: string | null
          ended_by: string | null
          end_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user1_id?: string | null
          user2_id?: string | null
          user1_is_guest?: boolean
          user2_is_guest?: boolean
          user1_display_name: string
          user2_display_name: string
          status?: SessionStatus
          shared_interests?: string[] | null
          match_score?: number | null
          started_at?: string
          ended_at?: string | null
          ended_by?: string | null
          end_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string | null
          user2_id?: string | null
          user1_is_guest?: boolean
          user2_is_guest?: boolean
          user1_display_name?: string
          user2_display_name?: string
          status?: SessionStatus
          shared_interests?: string[] | null
          match_score?: number | null
          started_at?: string
          ended_at?: string | null
          ended_by?: string | null
          end_reason?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          sender_id: string | null
          sender_is_guest: boolean
          sender_display_name: string
          content: string
          content_hash: string | null
          is_safe: boolean
          moderation_score: number | null
          moderated_by: string | null
          flagged_reason: string | null
          edited: boolean
          original_content: string | null
          read_by_recipient: boolean
          delivered: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          sender_id?: string | null
          sender_is_guest?: boolean
          sender_display_name: string
          content: string
          content_hash?: string | null
          is_safe?: boolean
          moderation_score?: number | null
          moderated_by?: string | null
          flagged_reason?: string | null
          edited?: boolean
          original_content?: string | null
          read_by_recipient?: boolean
          delivered?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          sender_id?: string | null
          sender_is_guest?: boolean
          sender_display_name?: string
          content?: string
          content_hash?: string | null
          is_safe?: boolean
          moderation_score?: number | null
          moderated_by?: string | null
          flagged_reason?: string | null
          edited?: boolean
          original_content?: string | null
          read_by_recipient?: boolean
          delivered?: boolean
          created_at?: string
        }
      }
      matchmaking_queue: {
        Row: {
          id: string
          user_id: string | null
          is_guest: boolean
          display_name: string
          tier: UserTier
          interests: string[] | null
          language_preference: string | null
          looking_for: string[] | null
          match_preferences: Json | null
          queue_score: number
          entered_at: string
          last_ping_at: string
          estimated_wait_time: number | null
          matched_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          is_guest?: boolean
          display_name: string
          tier?: UserTier
          interests?: string[] | null
          language_preference?: string | null
          looking_for?: string[] | null
          match_preferences?: Json | null
          queue_score?: number
          entered_at?: string
          last_ping_at?: string
          estimated_wait_time?: number | null
          matched_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          is_guest?: boolean
          display_name?: string
          tier?: UserTier
          interests?: string[] | null
          language_preference?: string | null
          looking_for?: string[] | null
          match_preferences?: Json | null
          queue_score?: number
          entered_at?: string
          last_ping_at?: string
          estimated_wait_time?: number | null
          matched_at?: string | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reporter_is_guest: boolean
          reported_user_id: string
          reported_user_is_guest: boolean
          session_id: string | null
          reason: string
          category: ReportCategory
          evidence: string | null
          status: ReportStatus
          priority: number
          reviewed_by: string | null
          review_notes: string | null
          action_taken: ModerationAction | null
          action_details: Json | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reporter_is_guest?: boolean
          reported_user_id: string
          reported_user_is_guest?: boolean
          session_id?: string | null
          reason: string
          category: ReportCategory
          evidence?: string | null
          status?: ReportStatus
          priority?: number
          reviewed_by?: string | null
          review_notes?: string | null
          action_taken?: ModerationAction | null
          action_details?: Json | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reporter_is_guest?: boolean
          reported_user_id?: string
          reported_user_is_guest?: boolean
          session_id?: string | null
          reason?: string
          category?: ReportCategory
          evidence?: string | null
          status?: ReportStatus
          priority?: number
          reviewed_by?: string | null
          review_notes?: string | null
          action_taken?: ModerationAction | null
          action_details?: Json | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          user_is_guest: boolean
          action_type: string
          resource_type: string
          resource_id: string | null
          details: Json
          ip_address: string | null
          user_agent: string | null
          country_code: string | null
          severity: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_is_guest?: boolean
          action_type: string
          resource_type: string
          resource_id?: string | null
          details: Json
          ip_address?: string | null
          user_agent?: string | null
          country_code?: string | null
          severity?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_is_guest?: boolean
          action_type?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          country_code?: string | null
          severity?: string | null
          created_at?: string
        }
      }
      moderation_rules: {
        Row: {
          id: string
          rule_type: string
          name: string
          pattern: string
          action: ModerationAction
          severity: number
          description: string | null
          is_active: boolean
          applies_to: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rule_type: string
          name: string
          pattern: string
          action: ModerationAction
          severity?: number
          description?: string | null
          is_active?: boolean
          applies_to?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rule_type?: string
          name?: string
          pattern?: string
          action?: ModerationAction
          severity?: number
          description?: string | null
          is_active?: boolean
          applies_to?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      banned_patterns: {
        Row: {
          id: string
          pattern: string
          pattern_type: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pattern: string
          pattern_type: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pattern?: string
          pattern_type?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: UserTier
          provider: string
          provider_subscription_id: string
          provider_customer_id: string | null
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: UserTier
          provider: string
          provider_subscription_id: string
          provider_customer_id?: string | null
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: UserTier
          provider?: string
          provider_subscription_id?: string
          provider_customer_id?: string | null
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          user_is_guest: boolean
          session_id: string | null
          properties: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          user_is_guest?: boolean
          session_id?: string | null
          properties?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          user_is_guest?: boolean
          session_id?: string | null
          properties?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      name_adjectives: {
        Row: {
          id: number
          adjective: string
          category: string
          popularity: number
          is_active: boolean
        }
        Insert: {
          id?: number
          adjective: string
          category: string
          popularity?: number
          is_active?: boolean
        }
        Update: {
          id?: number
          adjective?: string
          category?: string
          popularity?: number
          is_active?: boolean
        }
      }
      name_nouns: {
        Row: {
          id: number
          noun: string
          category: string
          gender_association: string | null
          popularity: number
          is_active: boolean
        }
        Insert: {
          id?: number
          noun: string
          category: string
          gender_association?: string | null
          popularity?: number
          is_active?: boolean
        }
        Update: {
          id?: number
          noun?: string
          category?: string
          gender_association?: string | null
          popularity?: number
          is_active?: boolean
        }
      }
      rate_limits: {
        Row: {
          id: string
          identifier: string
          endpoint: string
          count: number
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          identifier: string
          endpoint: string
          count?: number
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          identifier?: string
          endpoint?: string
          count?: number
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_display_name: {
        Args: { p_gender_preference?: string }
        Returns: string
      }
      create_guest_session: {
        Args: {
          p_ip_address?: string | null
          p_user_agent?: string | null
          p_country_code?: string | null
        }
        Returns: Array<{
          guest_id: string
          session_token: string
          display_name: string
          expires_at: string
        }>
      }
      validate_guest_session: {
        Args: {
          p_guest_id: string
          p_session_token?: string | null
        }
        Returns: Array<{
          is_valid: boolean
          display_name: string
          is_banned: boolean
          expires_at: string
        }>
      }
      check_content_advanced: {
        Args: {
          p_content: string
          p_user_id?: string | null
          p_is_guest?: boolean
        }
        Returns: Array<{
          is_safe: boolean
          safety_score: number
          flagged_reasons: string[]
          suggested_action: string
          confidence: number
        }>
      }
      handle_user_report: {
        Args: {
          p_reporter_id: string
          p_reporter_is_guest: boolean
          p_reported_user_id: string
          p_reported_user_is_guest: boolean
          p_session_id: string
          p_reason: string
          p_category: ReportCategory
          p_evidence: Json
        }
        Returns: Array<{
          report_id: string
          success: boolean
          message: string
          cooldown_remaining: number
        }>
      }
      match_users_v2: {
        Args: {
          p_user_id: string
          p_is_guest: boolean
          p_user_tier: UserTier
          p_user_interests: string[]
          p_min_age?: number
          p_max_age?: number
        }
        Returns: Array<{
          match_user_id: string | null
          match_is_guest: boolean
          match_display_name: string
          match_tier: UserTier
          match_score: number
          shared_interests: string[]
          estimated_wait_time: number
        }>
      }
      cleanup_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_endpoint: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: Array<{
          allowed: boolean
          remaining: number
          reset_seconds: number
        }>
      }
    }
    Enums: {
      user_tier: UserTier
      session_status: SessionStatus
      report_status: ReportStatus
      moderation_action: ModerationAction
    }
  }
}
