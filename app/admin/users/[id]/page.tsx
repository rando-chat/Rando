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
  useEffect(() => { supabase.from('users').select('*').eq('id', id).single().then(({ data }) => data && setUser(data)) }, [id])
  const handleBan = async (reason: string) => {
    await supabase.from('users').update({ is_banned: true, ban_reason: reason }).eq('id', id)
    setUser({ ...user, is_banned: true, ban_reason: reason })
  }
  const handleTierChange = async (tier: string) => {
    await supabase.from('users').update({ tier }).eq('id', id)
    setUser({ ...user, tier })
  }
  if (!user) return <DashboardLayout><div>Loading...</div></DashboardLayout>
  return <DashboardLayout><div><h1 className="text-2xl font-bold mb-6">User: {user.display_name}</h1><div className="grid md:grid-cols-2 gap-6"><UserDetail user={user} /><TierManager currentTier={user.tier} onChange={handleTierChange} /></div><button onClick={() => setShowBan(true)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Ban User</button>{showBan && <BanModal userId={id} onClose={() => setShowBan(false)} onBan={handleBan} />}</div></DashboardLayout>
}
