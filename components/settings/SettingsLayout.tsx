'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Lock, Bell, Palette, Shield, AlertTriangle } from 'lucide-react'

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/settings/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { href: '/settings/account', label: 'Account', icon: <Lock className="w-4 h-4" /> },
    { href: '/settings/privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
    { href: '/settings/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { href: '/settings/appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { href: '/settings/danger', label: 'Danger Zone', icon: <AlertTriangle className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow p-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
