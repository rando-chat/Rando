'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function AccountSettings() {
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ email })

    if (error) {
      setMessage(`❌ ${error.message}`)
    } else {
      setMessage('✅ Check your new email for confirmation')
      setEmail('')
    }
    setLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    })

    if (error) {
      setMessage(`❌ ${error.message}`)
    } else {
      setMessage('✅ Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 style={styles.title}>Account Settings</h1>
      <p style={styles.description}>
        Manage your account security and email
      </p>

      {/* Email Form */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Update Email</h2>
        <p style={styles.sectionDescription}>
          Change your email address
        </p>
        <form onSubmit={handleUpdateEmail}>
          <input
            type="email"
            placeholder="New email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            Update Email
          </button>
        </form>
      </div>

      {/* Password Form */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Change Password</h2>
        <p style={styles.sectionDescription}>
          Update your password
        </p>
        <form onSubmit={handleUpdatePassword}>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            Update Password
          </button>
        </form>
      </div>

      {message && <div style={styles.message}>{message}</div>}
    </div>
  )
}

const styles = {
  title: {
    fontSize: '28px',
    fontWeight: 600,
    fontFamily: "'Georgia', serif",
    color: '#f0f0f0',
    marginBottom: '8px',
  },
  description: {
    fontSize: '14px',
    color: '#a0a0b0',
    marginBottom: '32px',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid rgba(124,58,237,0.1)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#f0f0f0',
    marginBottom: '4px',
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#a0a0b0',
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: '8px',
    color: '#f0f0f0',
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none',
  },
  button: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  message: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid #22c55e',
    color: '#86efac',
    textAlign: 'center' as const,
  },
}