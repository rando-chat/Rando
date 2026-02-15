'use client'

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function SettingsPage() {
  return (
    <AuthGuard requireUser>
      <SettingsLayout>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
          <p style={{ color: '#6b7280', marginBottom: 32 }}>
            Manage your account settings and preferences
          </p>

          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ color: '#4b5563' }}>
              Select a settings category from the sidebar to get started.
            </p>
          </div>
        </div>
      </SettingsLayout>
    </AuthGuard>
  )
}