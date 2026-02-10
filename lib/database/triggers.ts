/**
 * Database Trigger Response Handlers
 * 
 * Handles responses from database triggers and automatic processes
 * Accounts for sanitize_message_content(), auto_ban_trigger(), etc.
 */

import type { Message } from '@/lib/supabase/client'

// ========================================
// MESSAGE SANITIZATION TRIGGER
// ========================================

/**
 * The sanitize_message_content() trigger automatically processes messages
 * This function helps interpret the trigger's response
 */
export interface MessageModerationResult {
  isSafe: boolean
  moderationScore: number | null
  flaggedReason: string | null
  suggestedAction: 'allow' | 'warn' | 'block'
}

export function interpretMessageModeration(
  message: Message
): MessageModerationResult {
  // Trigger sets is_safe based on content analysis
  const isSafe = message.is_safe
  const moderationScore = message.moderation_score ?? 1.0
  const flaggedReason = message.flagged_reason

  // Determine suggested action based on safety check
  let suggestedAction: 'allow' | 'warn' | 'block' = 'allow'

  if (!isSafe) {
    // If moderation score is very low, suggest blocking
    if (moderationScore !== null && moderationScore < 0.3) {
      suggestedAction = 'block'
    } else {
      suggestedAction = 'warn'
    }
  }

  return {
    isSafe,
    moderationScore,
    flaggedReason,
    suggestedAction,
  }
}

/**
 * Check if a message was flagged by the trigger
 */
export function isMessageFlagged(message: Message): boolean {
  return !message.is_safe || message.flagged_reason !== null
}

/**
 * Get user-friendly moderation message
 */
export function getModerationMessage(message: Message): string | null {
  if (message.is_safe) {
    return null
  }

  if (message.flagged_reason) {
    const reasons: Record<string, string> = {
      profanity: 'Your message contains inappropriate language',
      hate_speech: 'Your message contains hate speech or discriminatory content',
      personal_info: 'Your message appears to contain personal information',
      url_spam: 'Your message contains suspicious links',
      harassment: 'Your message may be considered harassment',
      threat: 'Your message contains threatening language',
      spam: 'Your message appears to be spam',
    }

    return reasons[message.flagged_reason] ?? 'Your message was flagged for review'
  }

  return 'Your message requires moderation review'
}

// ========================================
// AUTO-BAN TRIGGER
// ========================================

/**
 * The auto_ban_trigger() fires when a user accumulates too many reports
 * This function helps detect if a user has been auto-banned
 */
export interface BanStatus {
  isBanned: boolean
  banReason: string | null
  banExpiresAt: string | null
  isPermanent: boolean
}

export function checkBanStatus(user: {
  is_banned: boolean
  ban_reason: string | null
  ban_expires_at: string | null
}): BanStatus {
  const isBanned = user.is_banned
  const banReason = user.ban_reason
  const banExpiresAt = user.ban_expires_at

  // Check if ban is permanent (no expiration date)
  const isPermanent = isBanned && !banExpiresAt

  return {
    isBanned,
    banReason,
    banExpiresAt,
    isPermanent,
  }
}

/**
 * Check if a ban has expired
 */
export function isBanExpired(banExpiresAt: string | null): boolean {
  if (!banExpiresAt) {
    return false // No expiration = permanent ban
  }

  return new Date(banExpiresAt) < new Date()
}

/**
 * Get user-friendly ban message
 */
export function getBanMessage(banStatus: BanStatus): string {
  if (!banStatus.isBanned) {
    return ''
  }

  if (banStatus.isPermanent) {
    return `Your account has been permanently banned. Reason: ${
      banStatus.banReason ?? 'Multiple violations'
    }`
  }

  if (banStatus.banExpiresAt) {
    const expiryDate = new Date(banStatus.banExpiresAt)
    return `Your account is temporarily banned until ${expiryDate.toLocaleString()}. Reason: ${
      banStatus.banReason ?? 'Multiple violations'
    }`
  }

  return `Your account has been banned. Reason: ${
    banStatus.banReason ?? 'Multiple violations'
  }`
}

// ========================================
// TIMESTAMP TRIGGERS
// ========================================

/**
 * The update_updated_at_column() trigger automatically updates timestamps
 * This function checks if a record was recently updated by the trigger
 */
export function wasRecentlyUpdated(
  updatedAt: string,
  withinSeconds: number = 5
): boolean {
  const updated = new Date(updatedAt)
  const now = new Date()
  const diffSeconds = (now.getTime() - updated.getTime()) / 1000

  return diffSeconds <= withinSeconds
}

// ========================================
// AUDIT LOG TRIGGER
// ========================================

/**
 * The audit_log_trigger() automatically logs important actions
 * This function helps format audit log entries for display
 */
export interface AuditLogEntry {
  id: string
  userId: string | null
  actionType: string
  resourceType: string
  resourceId: string | null
  details: Record<string, any>
  severity: string | null
  createdAt: string
}

export function formatAuditLogAction(action: string): string {
  const actions: Record<string, string> = {
    user_created: 'Account Created',
    user_updated: 'Profile Updated',
    user_banned: 'Account Banned',
    user_unbanned: 'Account Unbanned',
    report_created: 'Report Submitted',
    report_resolved: 'Report Resolved',
    session_started: 'Chat Started',
    session_ended: 'Chat Ended',
    message_sent: 'Message Sent',
    message_flagged: 'Message Flagged',
  }

  return actions[action] ?? action.replace(/_/g, ' ').toUpperCase()
}

// ========================================
// REPORT COOLDOWN HANDLING
// ========================================

/**
 * The handle_user_report() function enforces cooldowns
 * This function helps interpret the cooldown response
 */
export interface ReportCooldownStatus {
  canReport: boolean
  cooldownRemaining: number
  message: string
}

export function interpretReportCooldown(
  reportResult: {
    success: boolean
    message: string
    cooldown_remaining: number
  }
): ReportCooldownStatus {
  return {
    canReport: reportResult.success,
    cooldownRemaining: reportResult.cooldown_remaining,
    message: reportResult.message,
  }
}

/**
 * Format cooldown time remaining
 */
export function formatCooldownTime(seconds: number): string {
  if (seconds <= 0) {
    return 'Ready'
  }

  if (seconds < 60) {
    return `${seconds} seconds`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  }

  const hours = Math.floor(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

// ========================================
// QUEUE CLEANUP
// ========================================

/**
 * The cleanup_stale_sessions() function runs periodically
 * This function checks if cleanup is needed
 */
export function shouldCleanupSessions(lastCleanup: string | null): boolean {
  if (!lastCleanup) {
    return true
  }

  const lastCleanupTime = new Date(lastCleanup)
  const now = new Date()
  const hoursSinceCleanup = (now.getTime() - lastCleanupTime.getTime()) / (1000 * 60 * 60)

  // Cleanup every 6 hours
  return hoursSinceCleanup >= 6
}

// ========================================
// CONTENT SAFETY HELPERS
// ========================================

/**
 * Interpret safety check results from check_content_advanced()
 */
export interface SafetyCheckResult {
  isSafe: boolean
  safetyScore: number
  flaggedReasons: string[]
  suggestedAction: string
  confidence: number
}

export function interpretSafetyCheck(result: {
  is_safe: boolean
  safety_score: number
  flagged_reasons: string[]
  suggested_action: string
  confidence: number
}): SafetyCheckResult {
  return {
    isSafe: result.is_safe,
    safetyScore: result.safety_score,
    flaggedReasons: result.flagged_reasons,
    suggestedAction: result.suggested_action,
    confidence: result.confidence,
  }
}

/**
 * Get severity level from safety score
 */
export function getSafetySerity(score: number): 'safe' | 'warning' | 'danger' {
  if (score >= 0.8) return 'safe'
  if (score >= 0.5) return 'warning'
  return 'danger'
}

/**
 * Get color class for safety score
 */
export function getSafetyColorClass(score: number): string {
  if (score >= 0.8) return 'text-green-600'
  if (score >= 0.5) return 'text-yellow-600'
  return 'text-red-600'
}
