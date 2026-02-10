'use client'
import { CheckCircle } from 'lucide-react'
export function SystemHealth() {
  const services = [
    { name: 'Database', status: 'operational', latency: '12ms' },
    { name: 'Realtime', status: 'operational', latency: '8ms' },
    { name: 'Storage', status: 'operational', latency: '45ms' },
    { name: 'Auth', status: 'operational', latency: '5ms' },
  ]
  return <div className="bg-white rounded-lg shadow p-6"><h2 className="text-xl font-bold mb-4">System Health</h2><div className="space-y-3">{services.map(s => <div key={s.name} className="flex items-center justify-between py-3 border-b last:border-0"><div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="font-medium">{s.name}</span></div><div className="flex items-center gap-4"><span className="text-sm text-gray-600">{s.latency}</span><span className="text-sm text-green-600">{s.status}</span></div></div>)}</div></div>
}
