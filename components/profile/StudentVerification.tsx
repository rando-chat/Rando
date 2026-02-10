'use client'

import { useState } from 'react'
import { GraduationCap, Loader2 } from 'lucide-react'
import { studentEmailSchema } from '@/lib/validators'

export function StudentVerification() {
  const [email, setEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleVerify = async () => {
    const validation = studentEmailSchema.safeParse(email)
    
    if (!validation.success) {
      setError(validation.error.errors[0].message)
      return
    }

    setIsVerifying(true)
    setError('')

    // TODO: Implement student verification
    setTimeout(() => {
      setIsVerifying(false)
      setSuccess(true)
    }, 2000)
  }

  return (
    <div className="bg-blue-50 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <GraduationCap className="w-6 h-6 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Student Verification
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Verify your student email to get free premium features!
          </p>

          {!success ? (
            <>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@university.edu"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || !email}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </>
          ) : (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg">
              ✓ Verification email sent! Check your inbox.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
