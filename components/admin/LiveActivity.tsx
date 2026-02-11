'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
export function LiveActivity() {
  const [activities, setActivities] = useState<any[]>([])
  useEffect(() => {
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(10).then(({ data }) => data && setActivities(data))
    const channel = supabase.channel('admin-activity').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, (payload) => {
      setActivities(prev => [payload.new, ...prev].slice(0, 10))
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
  return <div className="bg-white rounded-lg shadow p-6"><h2 className="text-xl font-bold mb-4">Live Activity</h2><div className="space-y-3 max-h-96 overflow-y-auto">{activities.map(a => <div key={a.id} className="flex items-start gap-3 py-2 border-b"><div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div><div className="flex-1"><p className="text-sm font-medium">{a.action_type}</p><p className="text-xs text-gray-600">{a.resource_type}</p></div><span className="text-xs text-gray-500">{formatRelativeTime(a.created_at)}</span></div>)}</div></div>
}
