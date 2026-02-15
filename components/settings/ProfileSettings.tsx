'use client'

import { useState } from 'react'
import { useIdentity } from '@/hooks/useIdentity'
import { useRouter } from 'next/navigation'

const INTEREST_OPTIONS = [
  'Music', 'Movies', 'Gaming', 'Sports', 'Travel',
  'Food', 'Art', 'Technology', 'Books', 'Fitness',
  'Photography', 'Dancing', 'Cooking', 'Nature', 'Science',
  'Anime', 'Comics', 'Fashion', 'Politics', 'Philosophy'
]

export function ProfileSettings() {
  const router = useRouter()
  const { identity, updateDisplayName, updateInterests } = useIdentity()
  const [displayName, setDisplayName] = useState(identity?.display_name || '')
  const [selectedInterests, setSelectedInterests] = useState<string[]>(identity?.interests || [])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest)
      }
      if (prev.length >= 10) {
        alert('Maximum 10 interests allowed')
        return prev
      }
      return [...prev, interest]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    let success = true

    if (displayName !== identity?.display_name) {
      success = await updateDisplayName(displayName) && success
    }

    if (JSON.stringify(selectedInterests) !== JSON.stringify(identity?.interests)) {
      success = await updateInterests(selectedInterests) && success
    }

    setMessage(success ? '✅ Profile updated!' : '❌ Update failed')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div>
      <h1 style={styles.title}>Profile Settings</h1>
      <p style={styles.description}>
        Update your profile information and interests
      </p>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Display Name</h2>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={32}
          style={styles.input}
        />
        <p style={styles.hint}>{displayName.length}/32 characters</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Interests</h2>
        <p style={styles.sectionDescription}>
          Select up to 10 interests for better matches
        </p>
        <div style={styles.interestsGrid}>
          {INTEREST_OPTIONS.map(interest => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              style={{
                ...styles.interestButton,
                background: selectedInterests.includes(interest) 
                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                  : 'rgba(255,255,255,0.05)',
                color: selectedInterests.includes(interest) ? 'white' : '#a0a0b0',
              }}
            >
              {interest}
            </button>
          ))}
        </div>
        <p style={styles.hint}>Selected: {selectedInterests.length}/10</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          ...styles.saveButton,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

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
    fontSize: '16px',
    outline: 'none',
  },
  hint: {
    fontSize: '12px',
    color: '#60607a',
    marginTop: '8px',
    textAlign: 'right' as const,
  },
  interestsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
    marginBottom: '12px',
  },
  interestButton: {
    padding: '8px 12px',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  saveButton: {
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '200px',
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