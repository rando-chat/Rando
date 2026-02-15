'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { supabase } from '@/lib/supabase/client'

export default function DangerZone() {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirm !== 'DELETE') {
      alert('Please type DELETE to confirm')
      return
    }

    setLoading(true)
    
    // Delete user data
    const { error } = await supabase.rpc('delete_user_account')
    
    if (error) {
      alert('Error deleting account: ' + error.message)
      setLoading(false)
      return
    }

    // Sign out
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/')
  }

  return (
    <AuthGuard requireUser>
      <SettingsLayout>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#ef4444' }}>Danger Zone</h1>
          <p style={{ color: '#6b7280', marginBottom: 32 }}>
            Irreversible actions - proceed with caution
          </p>

          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #fecaca',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#ef4444' }}>Delete Account</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <input
              type="text"
              placeholder='Type "DELETE" to confirm'
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #fecaca',
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 16,
                background: '#fef2f2',
              }}
            />
            
            <button
              onClick={handleDeleteAccount}
              disabled={loading || confirm !== 'DELETE'}
              style={{
                padding: '12px 24px',
                background: loading || confirm !== 'DELETE' ? '#fca5a5' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading || confirm !== 'DELETE' ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
          </div>
        </div>
      </SettingsLayout>
    </AuthGuard>
  )
}