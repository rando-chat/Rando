'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Shield, Settings } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { getDisplayName } = useAuth()
  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { href: '/admin/moderation', label: 'Moderation', icon: <Shield className="w-5 h-5" /> },
    { href: '/admin/system', label: 'System', icon: <Settings className="w-5 h-5" /> },
  ]
  return <div className="min-h-screen bg-gray-100"><div className="bg-purple-900 text-white px-6 py-4 flex justify-between items-center"><div className="flex items-center gap-3"><Shield className="w-6 h-6" /><h1 className="text-xl font-bold">Admin Dashboard</h1></div><span>Admin: {getDisplayName()}</span></div><div className="flex"><div className="w-64 bg-white border-r min-h-screen p-4"><nav className="space-y-2">{navItems.map(item => <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${pathname === item.href ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}>{item.icon}{item.label}</Link>)}</nav></div><div className="flex-1 p-8">{children}</div></div></div>
}
