'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const settingsSections = [
  {
    title: 'Account',
    icon: '👤',
    href: '/settings/account',
    items: [
      { name: 'Profile', href: '/settings/profile', icon: '📝' },
      { name: 'Account', href: '/settings/account', icon: '🔐' },
    ]
  },
  {
    title: 'Preferences',
    icon: '⚙️',
    href: '/settings',
    items: [
      { name: 'Appearance', href: '/settings/appearance', icon: '🎨' },
      { name: 'Notifications', href: '/settings/notifications', icon: '🔔' },
      { name: 'Privacy', href: '/settings/privacy', icon: '🛡️' },
    ]
  },
  {
    title: 'Chat',
    icon: '💬',
    href: '/settings/chat',
    items: [
      { name: 'Chat Settings', href: '/settings/chat', icon: '⚡' },
    ]
  },
  {
    title: 'Danger Zone',
    icon: '⚠️',
    href: '/settings/danger',
    items: [
      { name: 'Delete Account', href: '/settings/danger', icon: '🗑️' },
    ]
  }
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <div style={{
      width: '280px',
      background: 'rgba(10,10,15,0.95)',
      borderRight: '1px solid rgba(124,58,237,0.2)',
      padding: '32px 0',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 600,
          fontFamily: "'Georgia', serif",
          background: 'linear-gradient(135deg, #fff, #a0a0c0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '4px',
        }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: '#60607a' }}>
          Manage your account
        </p>
      </div>

      {settingsSections.map((section) => (
        <div key={section.title} style={{ marginBottom: '24px' }}>
          <div style={{
            padding: '8px 20px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#7c3aed',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {section.icon} {section.title}
          </div>
          {section.items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 20px',
                  margin: '2px 8px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(124,58,237,0.1)' : 'transparent',
                  color: isActive ? '#f0f0f0' : '#a0a0b0',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}