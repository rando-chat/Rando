'use client'

import { Check, Crown, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import type { UserTier } from '@/lib/database.types'

interface TierCardProps {
  name: string
  tier: UserTier
  price: string
  features: string[]
  currentTier: UserTier
  popular?: boolean
}

export function TierCard({ name, tier, price, features, currentTier, popular }: TierCardProps) {
  const isCurrent = currentTier === tier
  const icons = {
    student: <GraduationCap className="w-6 h-6" />,
    premium: <Crown className="w-6 h-6" />,
    free: null,
  }

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl p-8 ${popular ? 'ring-2 ring-purple-500' : ''}`}>
      {popular && (
        <div className="absolute top-0 right-8 -translate-y-1/2">
          <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        {icons[tier as keyof typeof icons] && (
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {icons[tier as keyof typeof icons]}
          </div>
        )}
        <h3 className="text-2xl font-bold">{name}</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-gray-600">/month</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <button disabled className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-semibold">
          Current Plan
        </button>
      ) : tier === 'student' ? (
        <Link
          href="/payments/verify-student"
          className="block w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700"
        >
          Verify Student Email
        </Link>
      ) : (
        <Link
          href={`/payments/upgrade?tier=${tier}`}
          className="block w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-center hover:opacity-90"
        >
          Upgrade Now
        </Link>
      )}
    </div>
  )
}
