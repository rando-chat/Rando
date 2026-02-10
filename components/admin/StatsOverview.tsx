'use client'
import { Users, MessageSquare, Shield, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function StatsOverview() {
  const [stats, setStats] = useState({ totalUsers: 0, activeChats: 0, pendingReports: 0, todayMatches: 0 })
  useEffect(() => {
    const load = async () => {
      const [u, c, r] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      setStats({ totalUsers: u.count || 0, activeChats: c.count || 0, pendingReports: r.count || 0, todayMatches: 0 })
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])
  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Chats', value: stats.activeChats, icon: <MessageSquare className="w-6 h-6" />, color: 'bg-green-100 text-green-600' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: <Shield className="w-6 h-6" />, color: 'bg-red-100 text-red-600' },
    { label: 'Today Matches', value: stats.todayMatches, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },
  ]
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{cards.map((s, i) => <div key={i} className="bg-white rounded-lg shadow p-6"><div className="flex items-center justify-between mb-4"><div className={`p-3 rounded-lg ${s.color}`}>{s.icon}</div><div className="text-3xl font-bold">{s.value}</div></div><div className="text-gray-600 text-sm">{s.label}</div></div>)}</div>
}
