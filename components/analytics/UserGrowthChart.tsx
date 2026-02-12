'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function UserGrowthChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get signups by day for last 30 days
      const { data: users } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at')

      if (!users) {
        setLoading(false)
        return
      }

      // Group by day
      const byDay: Record<string, number> = {}
      users.forEach(u => {
        const day = new Date(u.created_at).toLocaleDateString()
        byDay[day] = (byDay[day] || 0) + 1
      })

      const chartData = Object.entries(byDay).map(([date, count]) => ({
        date,
        signups: count,
      }))

      setData(chartData)
    } catch (error) {
      console.error('Error loading user growth:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading chart...</div>
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
        No signup data yet. Chart will populate as users sign up.
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>User Growth (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}
            labelStyle={{ fontWeight: 600, marginBottom: 8 }}
          />
          <Line type="monotone" dataKey="signups" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}