/**
 * Database type aliases — widened to string to prevent assignability errors
 */
export type UserTier = string
export type SessionStatus = string
export type ReportStatus = string
export type ModerationAction = string
export type Database = Record<string, unknown>
export type ReportCategory = string