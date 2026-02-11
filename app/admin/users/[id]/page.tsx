'use client'

import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { UserDetail } from '@/components/admin/users/UserDetail'
import { BanModal } from '@/components/admin/users/BanModal'
import { TierManager } from '@/components/admin/users/TierManager'

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [user, setUser] = useState<any>(null)
  const [showBan, setShowBan] = useState(false)

  useEffect(() => {
    supabase.from('users').select('*').eq('id', id).single()
      .then(({ data }) => data && setUser(data))
  }, [id])

  const reload = () => {
    supabase.from('users').select('*').eq('id', id).single()
      .then(({ data }) => data && setUser(data))
  }

  if (!user) return <DashboardLayout><div className="p-6">Loading...</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">User: {user.display_name}</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <UserDetail user={user} />
          <TierManager userId={id} currentTier={user.tier} onSuccess={reload} />
        </div>
        <button
          onClick={() => setShowBan(true)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Ban User
        </button>
        {showBan && (
          <BanModal
            userId={id}
            userName={user.display_name || 'User'}
            onClose={() => setShowBan(false)}
            onSuccess={() => { reload(); setShowBan(false) }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
