// lib/validations/index.ts
import { z } from 'zod'

// Common validations
export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(100)
export const displayNameSchema = z.string().min(1, 'Display name is required').max(32, 'Display name must be 32 characters or less')
export const ageSchema = z.number().min(13, 'You must be at least 13 years old').max(120, 'Invalid age')
export const bioSchema = z.string().max(500, 'Bio must be 500 characters or less').optional()
export const urlSchema = z.string().url('Invalid URL').optional().or(z.literal(''))

// Interest validation
export const interestSchema = z.string().min(1, 'Interest cannot be empty').max(50, 'Interest must be 50 characters or less')
export const interestsSchema = z.array(interestSchema).max(10, 'Maximum 10 interests allowed').optional()

// Message validation
export const messageContentSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message must be 2000 characters or less')
  .refine(
    (content) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content),
    'Message contains unsafe content'
  )
  .refine(
    (content) => !/javascript:/gi.test(content),
    'Message contains unsafe content'
  )
  .refine(
    (content) => !/on\w+=/gi.test(content),
    'Message contains unsafe content'
  )

// Chat session schemas
export const createGuestSessionSchema = z.object({
  // This would come from headers, not body
})

export const joinMatchmakingSchema = z.object({
  interests: interestsSchema.default([]),
  language_preference: z.string().length(2, 'Language must be 2 characters').default('en'),
  looking_for: z.array(z.enum(['text', 'voice', 'video'])).default(['text']),
  match_preferences: z.object({
    min_age: z.number().min(13).max(120).default(18),
    max_age: z.number().min(13).max(120).default(99)
  }).optional().default({
    min_age: 18,
    max_age: 99
  })
})

export const createChatSessionSchema = z.object({
  user1_id: z.string().uuid('Invalid user ID'),
  user2_id: z.string().uuid('Invalid user ID'),
  user1_is_guest: z.boolean().default(false),
  user2_is_guest: z.boolean().default(false),
  user1_display_name: displayNameSchema,
  user2_display_name: displayNameSchema,
  shared_interests: interestsSchema.default([]),
  match_score: z.number().min(0).max(100).optional()
})

export const sendMessageSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  content: messageContentSchema,
  sender_id: z.string().uuid('Invalid sender ID'),
  sender_is_guest: z.boolean().default(false),
  sender_display_name: displayNameSchema
})

export const createReportSchema = z.object({
  reporter_id: z.string().uuid('Invalid reporter ID'),
  reporter_is_guest: z.boolean().default(false),
  reported_user_id: z.string().uuid('Invalid reported user ID'),
  reported_user_is_guest: z.boolean().default(false),
  session_id: z.string().uuid('Invalid session ID').optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(1000, 'Reason must be 1000 characters or less'),
  category: z.enum([
    'harassment',
    'hate_speech', 
    'spam',
    'inappropriate_content',
    'underage',
    'sharing_personal_info',
    'threats',
    'other'
  ]),
  evidence: z.record(z.any()).optional().default({})
})

export const updateProfileSchema = z.object({
  display_name: displayNameSchema.optional(),
  bio: bioSchema,
  interests: interestsSchema,
  location: z.string().max(100, 'Location must be 100 characters or less').optional(),
  age: ageSchema.optional(),
  avatar_url: urlSchema
})

// User registration
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  display_name: displayNameSchema.optional(),
  age: ageSchema.optional()
})

// Type exports
export type CreateGuestSessionInput = z.infer<typeof createGuestSessionSchema>
export type JoinMatchmakingInput = z.infer<typeof joinMatchmakingSchema>
export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// Validation helper function
export function validate<T extends z.ZodType<any>>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }))
    
    throw new ValidationError('Validation failed', errors)
  }
  
  return result.data
}

// Custom error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ path: string; message: string }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}