// app/error.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Page error caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Something went wrong
        </h2>

        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred on this page.'}
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => reset()}
            variant="default"
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            Try again
          </Button>

          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50"
          >
            Go to home page
          </Button>

          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Go back
          </Button>
        </div>
      </Card>
    </div>
  )
}