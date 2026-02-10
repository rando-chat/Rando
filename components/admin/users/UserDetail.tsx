'use client'
import { formatRelativeTime } from '@/lib/utils'

export function UserDetail({ user }: { user: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-4">User Information</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-sm text-gray-700">Display Name</h4>
          <p className="mt-1">{user.display_name}</p>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-700">Tier</h4>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
            user.tier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
            user.tier === 'student' ? 'bg-blue-100 text-blue-800' :
            user.tier === 'admin' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.tier}
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-700">User ID</h4>
        <p className="text-sm font-mono mt-1 bg-gray-50 p-2 rounded">{user.id}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <h4 className="font-semibold text-sm text-gray-700">Matches</h4>
          <p className="text-2xl font-bold text-purple-600 mt-1">{user.match_count}</p>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-700">Reports</h4>
          <p className="text-2xl font-bold text-red-600 mt-1">{user.report_count}</p>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-700">Chat Time</h4>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {user.total_chat_time ? user.total_chat_time.split(':')[0] + 'h' : '0h'}
          </p>
        </div>
      </div>

      {user.bio && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700">Bio</h4>
          <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
        </div>
      )}

      {user.interests && user.interests.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700">Interests</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {user.interests.map((interest: string, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-sm text-gray-700">Status</h4>
        {user.is_banned ? (
          <div className="mt-1">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              Banned
            </span>
            {user.ban_reason && (
              <p className="text-sm text-red-600 mt-2">Reason: {user.ban_reason}</p>
            )}
          </div>
        ) : (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mt-1 inline-block">
            Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-sm text-gray-700">Created</h4>
          <p className="text-sm text-gray-600 mt-1">{formatRelativeTime(user.created_at)}</p>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-700">Last Seen</h4>
          <p className="text-sm text-gray-600 mt-1">
            {user.last_seen_at ? formatRelativeTime(user.last_seen_at) : 'Never'}
          </p>
        </div>
      </div>
    </div>
  )
}
