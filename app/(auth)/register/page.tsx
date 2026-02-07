// app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/database/client'
import { useToast } from '@/components/ui/toast'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      })
      return
    }

    if (!acceptTerms) {
      toast({
        title: 'Terms not accepted',
        description: 'Please accept the terms and conditions.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Generate a display name if not provided
      const finalDisplayName = displayName.trim() || `User${Math.floor(Math.random() * 10000)}`

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: finalDisplayName,
            age: age ? parseInt(age) : null,
          },
          emailRedirectTo: `${window.location.origin}/chat`,
        },
      })

      if (error) throw error

      toast({
        title: 'Check your email!',
        description: 'We sent you a confirmation link.',
        variant: 'success',
      })

      router.push('/login?registered=true')
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-coral-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join Rando Chat for better features
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <Input
                id="displayName"
                placeholder="CoolUser123"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={32}
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <Input
                id="age"
                type="number"
                placeholder="18+"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={13}
                max={120}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <Checkbox
            id="terms"
            label="I agree to the Terms of Service and Privacy Policy"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            required
          />

          <Checkbox
            id="ageCheck"
            label="I confirm that I am 13 years or older"
            checked={true}
            disabled
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-coral-500 to-pink-500 hover:from-coral-600 hover:to-pink-600"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-purple-600 hover:text-purple-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="mt-2">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← Back to home
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-purple-600 hover:underline">Community Guidelines</a>
            {' '}and confirm you are at least 13 years old.
          </p>
        </div>
      </Card>
    </div>
  )
}