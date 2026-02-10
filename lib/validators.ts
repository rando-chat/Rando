/**
 * Input Validators
 * 
 * Matches exact database constraints and validation rules
 * All validators aligned with database CHECK constraints
 */

import { z } from 'zod'
import type { UserTier, ReportCategory } from '@/lib/database.types'

// ========================================
// DISPLAY NAME VALIDATION
// ========================================

/**
 * Display name must be 1-32 characters (matches DB constraint)
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(32, 'Display name must be 32 characters or less')
  .regex(/^[a-zA-Z0-9\s-_]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores')
  .trim()

export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const result = displayNameSchema.safeParse(name)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

// ========================================
// BIO VALIDATION
// ========================================

/**
 * Bio must be 500 characters or less (matches DB constraint)
 */
export const bioSchema = z
  .string()
  .max(500, 'Bio must be 500 characters or less')
  .optional()
  .nullable()

export function validateBio(bio: string | null | undefined): { valid: boolean; error?: string } {
  const result = bioSchema.safeParse(bio)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

// ========================================
// MESSAGE CONTENT VALIDATION
// ========================================

/**
 * Message content must be 1-2000 characters (matches DB constraint)
 */
export const messageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message must be 2000 characters or less')
  .trim()

export function validateMessageContent(content: string): { valid: boolean; error?: string } {
  const result = messageContentSchema.safeParse(content)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

// ========================================
// EMAIL VALIDATION
// ========================================

/**
 * Email validation (standard format)
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim()

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const result = emailSchema.safeParse(email)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

/**
 * Student email validation (must match DB regex)
 */
export const studentEmailSchema = z
  .string()
  .email('Invalid email address')
  .regex(
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    'Invalid student email format'
  )
  .toLowerCase()
  .trim()

export function validateStudentEmail(email: string): { valid: boolean; error?: string } {
  const result = studentEmailSchema.safeParse(email)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

// ========================================
// PASSWORD VALIDATION
// ========================================

/**
 * Password must be strong (min 8 chars, includes uppercase, lowercase, number)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export function validatePassword(password: string): { valid: boolean; error?: string } {
  const result = passwordSchema.safeParse(password)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

// ========================================
// AGE VALIDATION
// ========================================

/**
 * Age must be 13-120 (matches DB constraint)
 */
export const ageSchema = z
  .number()
  .int('Age must be a whole number')
  .min(13, 'You must be at least 13 years old')
  .max(120, 'Invalid age')

export function validateAge(age: number): { valid: boolean; error?: string } {
  const result = ageSchema.safeParse(age)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

// ========================================
// INTERESTS VALIDATION
// ========================================

/**
 * Interests array validation
 */
export const interestsSchema = z
  .array(
    z.string()
      .min(1, 'Interest cannot be empty')
      .max(50, 'Interest must be 50 characters or less')
  )
  .max(20, 'Maximum 20 interests allowed')
  .optional()

export function validateInterests(interests: string[]): { valid: boolean; error?: string } {
  const result = interestsSchema.safeParse(interests)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

// ========================================
// REPORT VALIDATION
// ========================================

/**
 * Report reason must be 10-1000 characters (matches DB constraint)
 */
export const reportReasonSchema = z
  .string()
  .min(10, 'Reason must be at least 10 characters')
  .max(1000, 'Reason must be 1000 characters or less')
  .trim()

export const reportCategorySchema = z.enum([
  'harassment',
  'hate_speech',
  'spam',
  'inappropriate_content',
  'underage',
  'sharing_personal_info',
  'threats',
  'other',
] as const)

export function validateReportReason(reason: string): { valid: boolean; error?: string } {
  const result = reportReasonSchema.safeParse(reason)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

export function validateReportCategory(category: string): { valid: boolean; error?: string } {
  const result = reportCategorySchema.safeParse(category)
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0].message,
  }
}

// ========================================
// FORM SCHEMAS (for react-hook-form)
// ========================================

/**
 * Login form schema
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginFormSchema>

/**
 * Registration form schema
 */
export const registerFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: displayNameSchema,
  age: ageSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerFormSchema>

/**
 * Password reset form schema
 */
export const passwordResetFormSchema = z.object({
  email: emailSchema,
})

export type PasswordResetFormData = z.infer<typeof passwordResetFormSchema>

/**
 * Profile update form schema
 */
export const profileUpdateFormSchema = z.object({
  displayName: displayNameSchema,
  bio: bioSchema,
  interests: interestsSchema,
  age: ageSchema.optional(),
  location: z.string().max(100, 'Location must be 100 characters or less').optional(),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateFormSchema>

/**
 * Report form schema
 */
export const reportFormSchema = z.object({
  category: reportCategorySchema,
  reason: reportReasonSchema,
  evidence: z.string().optional(),
})

export type ReportFormData = z.infer<typeof reportFormSchema>

// ========================================
// SANITIZATION HELPERS
// ========================================

/**
 * Sanitize user input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Check for common patterns that should be blocked
 */
export function containsSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    /javascript:/i,
    /on\w+\s*=/i, // event handlers
    /<script/i,
    /<iframe/i,
    /data:text\/html/i,
  ]

  return suspiciousPatterns.some(pattern => pattern.test(text))
}
