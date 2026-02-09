'use client'
import { Ban, Shield, Settings, Download } from 'lucide-react'
import Link from 'next/link'
export function QuickActions() {
  const actions = [
    { label: 'Review Reports', href: '/admin/moderation', icon: <Shield className="w-5 h-5" />, color: 'bg-red-500' },
    { label: 'Manage Users', href: '/admin/users', icon: <Ban className="w-5 h-5" />, color: 'bg-blue-500' },
    { label: 'System Config', href: '/admin/system', icon: <Settings className="w-5 h-5" />, color: 'bg-gray-500' },
    { label: 'Export Data', href: '#', icon: <Download className="w-5 h-5" />, color: 'bg-green-500' },
  ]
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{actions.map(a => <Link key={a.label} href={a.href} className={`${a.color} text-white rounded-lg p-4 hover:opacity-90`}><div className="flex flex-col items-center gap-2">{a.icon}<span className="text-sm font-medium text-center">{a.label}</span></div></Link>)}</div>
}
