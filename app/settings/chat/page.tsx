'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { useState } from 'react'

export default function ChatSettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [saveHistory, setSaveHistory] = useState(true)

  return (
    <AuthGuard requireUser>
      <SettingsLayout>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Chat Settings</h1>
          <p style={{ color: '#6b7280', marginBottom: 32 }}>
            Customize your chat experience
          </p>

          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            {/* Notifications */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Message Notifications</h3>
                <p style={{ fontSize: 14, color: '#6b7280' }}>Get notified when you receive messages</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: notifications ? '#7c3aed' : '#ccc',
                  borderRadius: 24,
                  transition: '0.4s',
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: 20,
                    width: 20,
                    left: notifications ? 26 : 4,
                    bottom: 2,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.4s',
                  }} />
                </span>
              </label>
            </div>

            {/* Sound */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Message Sounds</h3>
                <p style={{ fontSize: 14, color: '#6b7280' }}>Play sound when messages arrive</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: sound ? '#7c3aed' : '#ccc',
                  borderRadius: 24,
                  transition: '0.4s',
                }}>
                  <span style={{
                    position: 'absolute',
                    height: 20,
                    width: 20,
                    left: sound ? 26 : 4,
                    bottom: 2,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.4s',
                  }} />
                </span>
              </label>
            </div>

            {/* Verified Only */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Verified Users Only</h3>
                <p style={{ fontSize: 14, color: '#6b7280' }}>Only match with verified accounts</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: verifiedOnly ? '#7c3aed' : '#ccc',
                  borderRadius: 24,
                  transition: '0.4s',
                }}>
                  <span style={{
                    position: 'absolute',
                    height: 20,
                    width: 20,
                    left: verifiedOnly ? 26 : 4,
                    bottom: 2,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.4s',
                  }} />
                </span>
              </label>
            </div>

            {/* Save History */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Save Chat History</h3>
                <p style={{ fontSize: 14, color: '#6b7280' }}>Keep messages after chat ends</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 24 }}>
                <input
                  type="checkbox"
                  checked={saveHistory}
                  onChange={(e) => setSaveHistory(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: saveHistory ? '#7c3aed' : '#ccc',
                  borderRadius: 24,
                  transition: '0.4s',
                }}>
                  <span style={{
                    position: 'absolute',
                    height: 20,
                    width: 20,
                    left: saveHistory ? 26 : 4,
                    bottom: 2,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.4s',
                  }} />
                </span>
              </label>
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