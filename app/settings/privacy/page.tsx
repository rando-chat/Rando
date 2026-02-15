'use client'

import { useState } from 'react'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function PrivacySettings() {
  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    allowFriendRequests: true,
    allowMessagesFromFriends: true,
    shareActivity: false,
  })

  return (
    <AuthGuard requireUser>
      <SettingsLayout>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy</h1>
          <p style={{ color: '#6b7280', marginBottom: 32 }}>
            Control your privacy settings
          </p>

          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </h3>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: value ? '#7c3aed' : '#ccc',
                    borderRadius: 24,
                    transition: '0.4s',
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: 20,
                      width: 20,
                      left: value ? 26 : 4,
                      bottom: 2,
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.4s',
                    }} />
                  </span>
                </label>
              </div>
            ))}
          </div>

          <button style={{
            marginTop: 20,
            padding: '12px 24px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Save Changes
          </button>
        </div>
      </SettingsLayout>
    </AuthGuard>
  )
}