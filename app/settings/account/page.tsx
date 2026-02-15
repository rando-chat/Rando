'use client'

import { useState, useEffect } from 'react'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'

export default function AccountSettings() {
  const { user, dbUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    loadSubscription()
  }, [dbUser])

  const loadSubscription = async () => {
    if (!dbUser?.id) return
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', dbUser.id)
      .maybeSingle()
    setSubscription(data)
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password updated successfully')
      e.currentTarget.reset()
    }
    setLoading(false)
  }

  const handleEmailChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    const newEmail = formData.get('newEmail') as string

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Verification email sent to ' + newEmail)
    }
    setLoading(false)
  }

  return (
    <SettingsLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Account Settings</h1>
        <p style={{ color: '#6b7280', marginBottom: 32 }}>
          Manage your account security and subscription
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Account Info */}
          <div style={{ padding: 24, background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Account Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 14, color: '#6b7280', display: 'block', marginBottom: 4 }}>Email</label>
                <p style={{ fontSize: 16, fontWeight: 500 }}>{user?.email || 'Not signed in'}</p>
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#6b7280', display: 'block', marginBottom: 4 }}>Account Tier</label>
                <p style={{ fontSize: 16, fontWeight: 500, textTransform: 'capitalize' }}>
                  {dbUser?.tier || 'Free'}
                </p>
              </div>
              {subscription && (
                <div>
                  <label style={{ fontSize: 14, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                    Subscription Status
                  </label>
                  <p style={{ fontSize: 16, fontWeight: 500, textTransform: 'capitalize' }}>
                    {subscription.status}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Change Email */}
          {user && (
            <div style={{ padding: 24, background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Change Email</h2>
              <form onSubmit={handleEmailChange}>
                <input
                  type="email"
                  name="newEmail"
                  placeholder="New email address"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    background: loading ? '#d1d5db' : '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Updating...' : 'Update Email'}
                </button>
              </form>
            </div>
          )}

          {/* Change Password */}
          {user && (
            <div style={{ padding: 24, background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Change Password</h2>
              <form onSubmit={handlePasswordChange}>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New password (min 8 characters)"
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    background: loading ? '#d1d5db' : '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a' }}>
              {success}
            </div>
          )}
        </div>
      </div>
    </SettingsLayout>
  )
}