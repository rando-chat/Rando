'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export function UsersTable() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, tier, is_banned, created_at, last_seen_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setUsers(data)
    setLoading(false)
  }

  const filteredUsers = users.filter((user) =>
    user.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.id.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="text-center py-8">Loading users...</div>

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-xl font-bold mb-4">All Users</h3>
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{user.display_name || 'No name'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.tier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                    user.tier === 'student' ? 'bg-blue-100 text-blue-800' :
                    user.tier === 'admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.tier}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.is_banned ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Banned
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-purple-600 hover:underline text-sm font-medium"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="px-6 py-12 text-center text-gray-600">
          No users found matching {JSON.stringify(search)}
        </div>
      )}
    </div>
  )
}
