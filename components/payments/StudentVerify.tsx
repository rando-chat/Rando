'use client'

import { useState } from 'react'
import { GraduationCap, Loader2 } from 'lucide-react'
import { studentEmailSchema } from '@/lib/validators'

export function StudentVerify() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async () => {
    const validation = studentEmailSchema.safeParse(email)
    if (!validation.success) {
      setError(validation.error.errors[0].message)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/verify/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStep('code')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to send verification code')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/verify/student', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      if (res.ok) {
        window.location.href = '/settings/profile'
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <GraduationCap className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">Student Verification</h2>
        </div>
        <p className="text-sm text-gray-700">
          Verify your .edu email to get free premium features
        </p>
      </div>

      {step === 'email' ? (
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium mb-2">Student Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.name@university.edu"
            className="w-full px-4 py-2 border rounded-lg mb-4"
          />
          
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          
          <button
            onClick={handleSendCode}
            disabled={isLoading || !email}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-4">
            Check your email for the verification code
          </p>
          
          <label className="block text-sm font-medium mb-2">Verification Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full px-4 py-2 border rounded-lg mb-4"
            maxLength={6}
          />
          
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          
          <button
            onClick={handleVerifyCode}
            disabled={isLoading || !code}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </div>
      )}
    </div>
  )
}
