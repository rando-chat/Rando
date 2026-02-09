'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export function SystemStatus() {
  const [status, setStatus] = useState({
    database: 'operational',
    realtime: 'operational',
    storage: 'operational',
    api: 'operational',
  })

  useEffect(() => {
    const checkHealth = () => {
      // In production, ping actual health endpoints
      setStatus({
        database: 'operational',
        realtime: 'operational',
        storage: 'operational',
        api: 'operational',
      })
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">System Status</h3>
      <div className="space-y-3">
        {Object.entries(status).map(([service, state]) => (
          <div key={service} className="flex items-center justify-between">
            <span className="capitalize">{service}</span>
            <div className="flex items-center gap-2">
              {state === 'operational' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm capitalize">{state}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
