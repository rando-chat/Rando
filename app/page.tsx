// app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/database/client'
import { useToast } from '@/components/ui/toast'

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'guest' | 'login' | 'register'>('guest')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleGuestLogin = async () => {
    setIsLoading(true)
    try {
      // Call our API to create guest session
      const response = await fetch('/api/guest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) throw new Error('Failed to create guest session')
      
      const data = await response.json()
      
      // Store guest session
      localStorage.setItem('rando-chat-guest-session', JSON.stringify(data))
      
      toast({
        title: 'Welcome!',
        description: `You are now chatting as ${data.display_name}`,
        variant: 'success',
      })
      
      router.push('/chat')
    } catch (error) {
      console.error('Guest login error:', error)
      toast({
        title: 'Error',
        description: 'Failed to create guest session. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
        variant: 'success',
      })
      
      router.push('/chat')
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: `User${Math.floor(Math.random() * 10000)}`,
          },
        },
      })
      
      if (error) throw error
      
      toast({
        title: 'Check your email!',
        description: 'We sent you a confirmation link.',
        variant: 'success',
      })
      
      setAuthMode('login')
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-coral-500 to-gold-500 bg-clip-text text-transparent mb-4">
            Rando Chat
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Connect with random people through intelligent, safe conversations
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary">🤖 Smart Matching</Badge>
            <Badge variant="secondary">🛡️ Safe & Moderated</Badge>
            <Badge variant="secondary">🎯 Interest-Based</Badge>
            <Badge variant="secondary">⚡ Real-time</Badge>
          </div>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Guest Chat Card */}
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-purple-100 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Quick Chat</h2>
              <p className="text-gray-600 mb-6">Start chatting instantly as a guest</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-gray-700">Random display name</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-gray-700">24-hour session</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-gray-700">Text chat only</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span className="text-gray-700">Basic matching</span>
              </li>
            </ul>
            
            <Button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-6 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isLoading && authMode === 'guest' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating session...
                </span>
              ) : (
                'Start Chatting as Guest'
              )}
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              No account needed • 100% free
            </p>
          </Card>

          {/* Registered User Card */}
          <Card className="p-8 bg-gradient-to-br from-gold-50 to-yellow-50 border-2 border-gold-200 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Quality Chat</h2>
              <p className="text-gray-600 mb-6">Better experience with an account</p>
            </div>
            
            {authMode === 'guest' ? (
              <>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span className="text-purple-600 text-sm">★</span>
                    </div>
                    <span className="text-gray-700">Custom display name</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span className="text-purple-600 text-sm">★</span>
                    </div>
                    <span className="text-gray-700">Priority matching</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span className="text-purple-600 text-sm">★</span>
                    </div>
                    <span className="text-gray-700">Save interests & history</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span className="text-purple-600 text-sm">★</span>
                    </div>
                    <span className="text-gray-700">Advanced features</span>
                  </li>
                </ul>
                
                <div className="space-y-4">
                  <Button
                    onClick={() => setAuthMode('login')}
                    variant="outline"
                    className="w-full py-4 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => setAuthMode('register')}
                    className="w-full py-4 bg-gradient-to-r from-coral-500 to-pink-500 hover:from-coral-600 hover:to-pink-600"
                  >
                    Create Account
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={authMode === 'login' ? handleEmailLogin : handleRegister} className="space-y-6">
                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="py-3"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="py-3"
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-coral-500 to-pink-500 hover:from-coral-600 hover:to-pink-600"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </span>
                    ) : (
                      authMode === 'login' ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAuthMode('guest')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Back to options
                    </button>
                    
                    {authMode === 'login' ? (
                      <button
                        type="button"
                        onClick={() => setAuthMode('register')}
                        className="text-sm text-coral-600 hover:text-coral-700"
                      >
                        Need an account?
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="text-sm text-coral-600 hover:text-coral-700"
                      >
                        Already have an account?
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
            
            <p className="text-center text-sm text-gray-500 mt-6">
              Secure • Private • No spam
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            By using Rando Chat, you agree to our{' '}
            <a href="#" className="text-purple-600 hover:underline">Community Guidelines</a>
            {' '}and{' '}
            <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Must be 13+ to use • Report inappropriate behavior • Be kind to others
          </p>
        </div>
      </div>
    </div>
  )
}