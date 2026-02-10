'use client'

import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { createPortalSession } from '@/lib/payments/stripe'
import { useAuth } from '@/components/auth/AuthProvider'

export function BillingPortal() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenPortal = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const url = await createPortalSession(user.id)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Billing Portal</h3>
      <p className="text-gray-600 mb-4">
        Manage your subscription, update payment method, and view invoices.
      </p>
      
      <button
        onClick={handleOpenPortal}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4" />
        )}
        {isLoading ? 'Opening...' : 'Open Billing Portal'}
      </button>
    </div>
  )
}
