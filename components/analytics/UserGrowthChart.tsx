'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase/client'

export function UserGrowthChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    loadUserGrowth()
  }, [])

  const loadUserGrowth = async () => {
    const { data: users } = await supabase
      .from('users')
      .select('created_at')
      .order('created_at', { ascending: true })

    if (!users) return

    // Group by day
    const grouped = users.reduce((acc: any, user) => {
      const date = new Date(user.created_at).toLocaleDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // Convert to cumulative
    let cumulative = 0
    const chartData = Object.entries(grouped).map(([date, count]) => {
      cumulative += count as number
      return { date, users: cumulative }
    }).slice(-30) // Last 30 days

    setData(chartData)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">User Growth (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
