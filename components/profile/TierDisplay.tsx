'use client'

import { Crown, GraduationCap, User, Shield } from 'lucide-react'
import type { UserTier } from '@/lib/database.types'
import Link from 'next/link'

interface TierDisplayProps {
  tier: UserTier
  showUpgrade?: boolean
}

export function TierDisplay({ tier, showUpgrade = false }: TierDisplayProps) {
  const tierConfig = {
    free: {
      icon: <User className="w-4 h-4" />,
      label: 'Free',
      color: 'bg-gray-100 text-gray-700',
    },
    student: {
      icon: <GraduationCap className="w-4 h-4" />,
      label: 'Student',
      color: 'bg-blue-100 text-blue-700',
    },
    premium: {
      icon: <Crown className="w-4 h-4" />,
      label: 'Premium',
      color: 'bg-yellow-100 text-yellow-700',
    },
    admin: {
      icon: <Shield className="w-4 h-4" />,
      label: 'Admin',
      color: 'bg-purple-100 text-purple-700',
    },
  }

  const config = tierConfig[tier]

  return (
    <div className="flex items-center gap-2">
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${config.color}`}>
        {config.icon}
        {config.label}
      </span>

      {showUpgrade && tier === 'free' && (
        <Link
          href="/upgrade"
          className="text-sm text-purple-600 hover:underline"
        >
          Upgrade to Premium
        </Link>
      )}

      {showUpgrade && tier === 'free' && (
        <Link
          href="/student-verification"
          className="text-sm text-blue-600 hover:underline"
        >
          Get Student Discount
        </Link>
      )}
    </div>
  )
}
