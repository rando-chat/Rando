'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'

export function RealTimeActivity() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    loadRecentEvents()

    const channel = supabase
      .channel('analytics-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'analytics_events'
      }, (payload) => {
        setEvents(prev => [payload.new, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadRecentEvents = async () => {
    const { data } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setEvents(data)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Real-Time Activity</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-3 py-2 border-b last:border-0">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">{event.event_type}</p>
              <p className="text-xs text-gray-600">{event.user_id?.slice(0, 8) || 'Guest'}</p>
            </div>
            <span className="text-xs text-gray-500">{formatRelativeTime(event.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
