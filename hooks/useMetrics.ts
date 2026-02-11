import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useMetrics() {
  const [revenue, setRevenue] = useState({ mrr: 0, arr: 0, churn: 0 })

  useEffect(() => {
    calculateRevenue()
  }, [])

  const calculateRevenue = async () => {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('tier, status, created_at')

    if (!subs) return

    const active = subs.filter(s => s.status === 'active')
    const mrr = active.reduce((sum, s) => {
      return sum + (s.tier === 'student' ? 4.99 : s.tier === 'premium' ? 9.99 : 0)
    }, 0)

    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const cancelled = subs.filter(s => s.status === 'canceled' && new Date(s.created_at) > monthAgo).length
    const churn = active.length > 0 ? (cancelled / active.length) * 100 : 0

    setRevenue({
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      churn: Math.round(churn * 10) / 10,
    })
  }

  return { revenue, refresh: calculateRevenue }
}
