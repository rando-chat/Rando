import { checkContentSafety } from '@/lib/database/queries'

export async function validateMessageSafety(content: string, userId: string, isGuest: boolean) {
  const result = await checkContentSafety(content, userId, isGuest)
  if (!result) return { safe: true, score: 1.0 }
  
  return {
    safe: result.is_safe,
    score: result.safety_score,
    reasons: result.flagged_reasons,
  }
}
