'use client'
import { CheckCircle } from 'lucide-react'
export function VerificationBadge({ verified }: { verified: boolean }) {
  if (!verified) return null
  return <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" />Verified</span>
}
