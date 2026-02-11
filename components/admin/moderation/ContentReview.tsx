'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'

export function ContentReview() {
  const [flagged, setFlagged] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFlaggedContent()
  }, [])

  const loadFlaggedContent = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('is_safe', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setFlagged(data)
    setLoading(false)
  }

  if (loading) return <div className="text-center py-8">Loading flagged content...</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold">Flagged Messages</h3>
        <p className="text-sm text-gray-600">Messages flagged by content moderation</p>
      </div>

      {flagged.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No flagged messages
        </div>
      ) : (
        <div className="space-y-3">
          {flagged.map((message) => (
            <div key={message.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-600">
                  Message ID: {message.id.slice(0, 8)}...
                </span>
                <span className="text-xs text-gray-600">
                  {formatRelativeTime(message.created_at)}
                </span>
              </div>
              <p className="text-sm mb-2">{message.content}</p>
              <div className="flex gap-4 text-xs">
                <span className="text-gray-600">
                  Safety Score: <strong>{((message.moderation_score || 0) * 100).toFixed(0)}%</strong>
                </span>
                {message.flagged_reason && (
                  <span className="text-red-600">
                    Reason: <strong>{message.flagged_reason}</strong>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
