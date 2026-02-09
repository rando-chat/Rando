'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.auth.resetPasswordForEmail(email)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <form onSubmit={handleReset} className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6">Reset Password</h1>
        {sent ? <p className="text-green-600">Check your email!</p> : (
          <>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" placeholder="Email" required />
            <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg">Send Reset Link</button>
          </>
        )}
      </form>
    </div>
  )
}
