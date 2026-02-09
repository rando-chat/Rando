'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, MessageSquare, DollarSign, TrendingUp } from 'lucide-react'

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    mrr: 0,
  })

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const loadMetrics = async () => {
    const [users, activeToday, messages, subs] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('tier').eq('status', 'active'),
    ])

    const mrr = (subs.data || []).reduce((sum, sub) => {
      return sum + (sub.tier === 'student' ? 4.99 : sub.tier === 'premium' ? 9.99 : 0)
    }, 0)

    setMetrics({
      totalUsers: users.count || 0,
      activeUsers: activeToday.count || 0,
      totalMessages: messages.count || 0,
      mrr: Math.round(mrr),
    })
  }

  const cards = [
    { label: 'Total Users', value: metrics.totalUsers, icon: <Users className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600', change: '+12%' },
    { label: 'Active Today', value: metrics.activeUsers, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-green-100 text-green-600', change: '+8%' },
    { label: 'Total Messages', value: metrics.totalMessages.toLocaleString(), icon: <MessageSquare className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600', change: '+25%' },
    { label: 'MRR', value: `$${metrics.mrr}`, icon: <DollarSign className="w-6 h-6" />, color: 'bg-green-100 text-green-600', change: '+15%' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              {card.icon}
            </div>
            <span className="text-sm text-green-600 font-semibold">{card.change}</span>
          </div>
          <div className="text-3xl font-bold mb-1">{card.value}</div>
          <div className="text-gray-600 text-sm">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
