'use client'

import { useState } from 'react'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function AppearanceSettings() {
  const [theme, setTheme] = useState('dark')
  const [fontSize, setFontSize] = useState('medium')

  return (
    <AuthGuard requireUser>
      <SettingsLayout>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Appearance</h1>
          <p style={{ color: '#6b7280', marginBottom: 32 }}>
            Customize how Rando looks
          </p>

          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}>
            {/* Theme */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Theme</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                {['dark', 'light', 'system'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: theme === t ? '#7c3aed' : '#f3f4f6',
                      color: theme === t ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Font Size</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                {['small', 'medium', 'large'].map(size => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: fontSize === size ? '#7c3aed' : '#f3f4f6',
                      color: fontSize === size ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 16,
                      fontWeight: 500,
                    }}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
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