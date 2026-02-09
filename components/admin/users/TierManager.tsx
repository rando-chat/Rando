'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface TierManagerProps {
  userId: string
  currentTier: string
  onSuccess: () => void
}

export function TierManager({ userId, currentTier, onSuccess }: TierManagerProps) {
  const [tier, setTier] = useState(currentTier)
  const [loading, setLoading] = useState(false)

  const tiers = [
    { value: 'free', label: 'Free', color: 'bg-gray-100 text-gray-800' },
    { value: 'student', label: 'Student', color: 'bg-blue-100 text-blue-800' },
    { value: 'premium', label: 'Premium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  ]

  const handleUpdate = async () => {
    if (tier === currentTier) {
      alert('Tier is already set to this value')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ tier })
        .eq('id', userId)

      if (error) throw error

      // Log to audit trail
      await supabase.from('audit_log').insert({
        action_type: 'tier_changed',
        resource_type: 'user',
        resource_id: userId,
        details: { from: currentTier, to: tier },
      })

      alert('Tier updated successfully')
      onSuccess()
    } catch (error) {
      console.error('Error updating tier:', error)
      alert('Failed to update tier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Manage User Tier</h3>

      <div className="space-y-3 mb-6">
        {tiers.map((t) => (
          <label key={t.value} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="tier"
              value={t.value}
              checked={tier === t.value}
              onChange={(e) => setTier(e.target.value)}
              className="w-4 h-4 text-purple-600"
              disabled={loading}
            />
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${t.color}`}>
              {t.label}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={handleUpdate}
        disabled={loading || tier === currentTier}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating...' : 'Update Tier'}
      </button>

      <p className="mt-4 text-xs text-gray-600">
        <strong>Note:</strong> Changing tier affects user permissions and features access.
      </p>
    </div>
  )
}
