'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase/client'

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    loadRevenue()
  }, [])

  const loadRevenue = async () => {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('created_at, tier')
      .order('created_at', { ascending: true })

    if (!subs) return

    // Group by month
    const grouped = subs.reduce((acc: any, sub) => {
      const month = new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const revenue = sub.tier === 'student' ? 4.99 : sub.tier === 'premium' ? 9.99 : 0
      acc[month] = (acc[month] || 0) + revenue
      return acc
    }, {})

    const chartData = Object.entries(grouped).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue as number),
    })).slice(-6) // Last 6 months

    setData(chartData)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Revenue Trend (Last 6 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value}`} />
          <Bar dataKey="revenue" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
