'use client'

import { MessageSquare, Users, Clock, TrendingUp } from 'lucide-react'
import type { User as DBUser } from '@/lib/supabase/client'

export function StatsDisplay({ user }: { user: DBUser }) {
  const totalHours = Math.floor(parseInt(user.total_chat_time.split(':')[0]) / 60)
  const totalMinutes = parseInt(user.total_chat_time.split(':')[1])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{user.match_count}</div>
            <div className="text-sm text-gray-600">Total Matches</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <div className="text-sm text-gray-600">Chat Time</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{user.report_count}</div>
            <div className="text-sm text-gray-600">Reports</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {user.match_count > 0 ? Math.round((user.match_count - user.report_count) / user.match_count * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Good Rating</div>
          </div>
        </div>
      </div>
    </div>
  )
}
