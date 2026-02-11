'use client'
import { AlertTriangle } from 'lucide-react'
export function AlertFeed() {
  const alerts = [{ severity: 'high', message: '3 users banned in last hour', time: '5m ago' }]
  return <div className="bg-white rounded-lg shadow p-6"><h2 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" />Alerts</h2><div className="space-y-3">{alerts.map((a, i) => <div key={i} className="p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-sm font-medium">{a.message}</p><p className="text-xs text-gray-600 mt-1">{a.time}</p></div>)}</div></div>
}
