'use client'

import { use, useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => c - 1)
    }, 1000)

    const timeout = setTimeout(() => {
      window.location.href = '/settings/profile'
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-12 max-w-lg text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Your account has been upgraded. Thank you for subscribing!
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          Redirecting in {countdown} seconds...
        </p>
        
        <Link
          href="/settings/profile"
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
        >
          Go to Profile
        </Link>
      </div>
    </div>
  )
}
