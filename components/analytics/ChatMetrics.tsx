'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function ChatMetrics() {
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    avgDuration: 0,
    matchSuccessRate: 0,
    messagesPerSession: 0,
  })

  useEffect(() => {
    loadChatMetrics()
  }, [])

  const loadChatMetrics = async () => {
    const [sessions, messages] = await Promise.all([
      supabase.from('chat_sessions').select('total_duration, status'),
      supabase.from('messages').select('session_id'),
    ])

    const totalSessions = sessions.data?.length || 0
    const successfulMatches = sessions.data?.filter(s => s.status === 'ended').length || 0
    const avgDuration = sessions.data?.reduce((sum, s) => {
      const duration = s.total_duration?.split(':').reduce((acc, time, idx) => {
        return acc + parseInt(time) * (idx === 0 ? 3600 : idx === 1 ? 60 : 1)
      }, 0) || 0
      return sum + duration
    }, 0) || 0

    const messageCount = messages.data?.length || 0

    setMetrics({
      totalSessions,
      avgDuration: Math.round(avgDuration / totalSessions / 60) || 0,
      matchSuccessRate: totalSessions > 0 ? Math.round((successfulMatches / totalSessions) * 100) : 0,
      messagesPerSession: totalSessions > 0 ? Math.round(messageCount / totalSessions) : 0,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-6">Chat Metrics</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-3xl font-bold text-purple-600">{metrics.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-blue-600">{metrics.avgDuration}m</div>
          <div className="text-sm text-gray-600">Avg Duration</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-green-600">{metrics.matchSuccessRate}%</div>
          <div className="text-sm text-gray-600">Match Success</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-orange-600">{metrics.messagesPerSession}</div>
          <div className="text-sm text-gray-600">Msgs/Session</div>
        </div>
      </div>
    </div>
  )
}
