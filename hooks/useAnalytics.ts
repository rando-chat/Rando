import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAnalytics() {
  const [metrics, setMetrics] = useState({
    dau: 0,
    mau: 0,
    totalUsers: 0,
    activeChats: 0,
  })

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [total, dau, mau, chats] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_seen_at', dayAgo.toISOString()),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_seen_at', monthAgo.toISOString()),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    setMetrics({
      totalUsers: total.count || 0,
      dau: dau.count || 0,
      mau: mau.count || 0,
      activeChats: chats.count || 0,
    })
  }

  return { metrics, refresh: loadMetrics }
}
