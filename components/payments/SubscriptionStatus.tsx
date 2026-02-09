'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { formatRelativeTime } from '@/lib/utils'

export function SubscriptionStatus() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    if (user) {
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
        .then(({ data }) => data && setSubscription(data))
    }
  }, [user])

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No active subscription</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Current Subscription</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Plan:</span>
          <span className="font-semibold capitalize">{subscription.tier}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {subscription.status}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Renews:</span>
          <span>{formatRelativeTime(subscription.current_period_end)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Provider:</span>
          <span className="capitalize">{subscription.provider}</span>
        </div>
      </div>
    </div>
  )
}
