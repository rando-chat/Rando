'use client'

import { useState } from 'react'

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    messages: true,
    friendRequests: true,
    matches: true,
    sound: false,
  })

  return (
    <div>
      <h1 style={styles.title}>Notifications</h1>
      <p style={styles.description}>Control what you get notified about</p>
      
      <div style={styles.card}>
        {Object.entries(settings).map(([key, value]) => (
          <label key={key} style={styles.checkbox}>
            <input
              type="checkbox"
              checked={value}
              onChange={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))}
            />
            <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

const styles = {
  title: { fontSize: '28px', fontWeight: 600, fontFamily: "'Georgia', serif", color: '#f0f0f0', marginBottom: '8px' },
  description: { fontSize: '14px', color: '#a0a0b0', marginBottom: '32px' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(124,58,237,0.1)' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', cursor: 'pointer' },
}