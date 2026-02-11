import { z } from 'zod'
export const profileSchema = z.object({
  displayName: z.string().min(1).max(32),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).max(20).optional(),
  age: z.number().min(13).max(120).optional(),
})
