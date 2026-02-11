'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createCheckoutSession } from '@/lib/payments/stripe'
import { useAuth } from '@/components/auth/AuthProvider'

export function CheckoutForm({ tier }: { tier: string }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const url = await createCheckoutSession(user.id, tier as any)
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to create checkout session')
    } finally {
      setIsLoading(false)
    }
  }

  const prices = {
    student: '$4.99',
    premium: '$9.99',
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Complete Your Purchase</h2>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Plan:</span>
          <span className="font-semibold capitalize">{tier}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Price:</span>
          <span className="font-semibold">{prices[tier as keyof typeof prices]}/month</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Processing...' : 'Proceed to Checkout'}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Secure payment powered by Stripe
      </p>
    </div>
  )
}