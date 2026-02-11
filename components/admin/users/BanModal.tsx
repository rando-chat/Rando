'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface BanModalProps {
  userId: string
  userName: string
  onClose: () => void
  onSuccess: () => void
}

export function BanModal({ userId, userName, onClose, onSuccess }: BanModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBan = async () => {
    if (!reason.trim()) {
      alert('Please provide a ban reason')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_banned: true,
          ban_reason: reason,
        })
        .eq('id', userId)

      if (error) throw error

      // Log to audit trail
      await supabase.from('audit_log').insert({
        action_type: 'user_banned',
        resource_type: 'user',
        resource_id: userId,
        details: { reason },
      })

      alert('User banned successfully')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error banning user:', error)
      alert('Failed to ban user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Ban User</h3>
        <p className="text-gray-600 mb-4">
          You are about to ban <strong>{userName}</strong>. This action will prevent them from accessing the platform.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ban Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for ban (required)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBan}
            disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Banning...' : 'Ban User'}
          </button>
        </div>
      </div>
    </div>
  )
}
