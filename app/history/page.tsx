'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'

export default function HistoryPage() {
  const { getUserId, isGuest } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const userId = getUserId()
    if (!userId) return

    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20)

    setSessions(data || [])
    setIsLoading(false)
  }

  return (
    <AuthGuard requireUser>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Chat History</h1>
          
          {isLoading ? (
            <div className="text-center">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-gray-600">No chat history yet</div>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <Link
                  key={session.id}
                  href={`/history/${session.id}`}
                  className="block bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">
                        Chat with {session.user1_id === getUserId() ? session.user2_display_name : session.user1_display_name}
                      </p>
                      <p className="text-sm text-gray-600">{formatRelativeTime(session.created_at)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      session.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
