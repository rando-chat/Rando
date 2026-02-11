import { useState } from 'react'
import { submitUserReport } from '@/lib/database/queries'
import { useAuth } from '@/components/auth/AuthProvider'

export function useReports() {
  const { getUserId, isGuest } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitReport = async ({ sessionId, category, reason }: any) => {
    setIsSubmitting(true)
    try {
      // Get reported user from session
      const reporterId = getUserId()!
      await submitUserReport({
        reporterId,
        reporterIsGuest: isGuest,
        reportedUserId: 'reported-user-id', // Get from session
        reportedUserIsGuest: false,
        sessionId,
        reason,
        category,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submitReport, isSubmitting }
}
