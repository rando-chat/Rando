'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DangerZone() {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirm !== 'DELETE') {
      alert('Please type DELETE to confirm')
      return
    }

    setLoading(true)
    // Delete account logic here
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/')
  }

  return (
    <div>
      <h1 style={styles.title}>Danger Zone</h1>
      <p style={styles.description}>Irreversible actions</p>
      
      <div style={{...styles.card, borderColor: 'rgba(239,68,68,0.3)'}}>
        <h2 style={{...styles.sectionTitle, color: '#ef4444'}}>Delete Account</h2>
        <p style={styles.warning}>
          This will permanently delete your account and all data.
        </p>
        
        <input
          type="text"
          placeholder='Type "DELETE" to confirm'
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={styles.input}
        />
        
        <button
          onClick={handleDeleteAccount}
          disabled={loading || confirm !== 'DELETE'}
          style={{
            ...styles.deleteButton,
            opacity: loading || confirm !== 'DELETE' ? 0.5 : 1,
          }}
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  title: { fontSize: '28px', fontWeight: 600, fontFamily: "'Georgia', serif", color: '#f0f0f0', marginBottom: '8px' },
  description: { fontSize: '14px', color: '#a0a0b0', marginBottom: '32px' },
  card: { background: 'rgba(239,68,68,0.05)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(239,68,68,0.2)' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '8px' },
  warning: { fontSize: '14px', color: '#a0a0b0', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f0f0f0', marginBottom: '16px' },
  deleteButton: { padding: '12px 24px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' },
}