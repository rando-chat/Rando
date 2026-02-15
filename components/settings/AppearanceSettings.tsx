'use client'

import { useState } from 'react'

export function AppearanceSettings() {
  const [theme, setTheme] = useState('dark')

  return (
    <div>
      <h1 style={styles.title}>Appearance</h1>
      <p style={styles.description}>Customize how Rando looks</p>
      
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Theme</h2>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {['dark', 'light', 'system'].map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                ...styles.themeButton,
                background: theme === t ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
                color: theme === t ? 'white' : '#a0a0b0',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  title: { fontSize: '28px', fontWeight: 600, fontFamily: "'Georgia', serif", color: '#f0f0f0', marginBottom: '8px' },
  description: { fontSize: '14px', color: '#a0a0b0', marginBottom: '32px' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(124,58,237,0.1)' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: '#f0f0f0' },
  themeButton: { flex: 1, padding: '12px', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', cursor: 'pointer' },
}