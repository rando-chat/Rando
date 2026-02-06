// app/src/pages/LandingPage.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { signIn, signUp } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick anonymous chat
  const handleQuickChat = async () => {
    setLoading(true);
    try {
      // Generate guest ID
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const guestUsername = `Guest_${Math.random().toString(36).substr(2, 6)}`;
      
      // Store in localStorage
      localStorage.setItem('rando_guest_id', guestId);
      localStorage.setItem('rando_guest_username', guestUsername);
      
      // Try to save in database (optional)
      try {
        await supabase.from('guest_sessions').insert({
          id: guestId,
          username: guestUsername,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        });
      } catch (dbError) {
        console.log('Guest session not saved to DB, using localStorage only');
      }
      
      toast.success('Starting anonymous chat...');
      router.push('/chat');
    } catch (error) {
      toast.error('Failed to start chat');
      console.error('Guest chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password required');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, username || `user_${Date.now().toString().slice(-6)}`);
      }

      if (result.success) {
        toast.success(isLogin ? 'Welcome back!' : 'Account created!');
        router.push('/chat');
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Simple Header */}
      <div className="text-center pt-20 px-4">
        <h1 className="text-7xl md:text-9xl font-bold mb-6 bg-gradient-to-r from-gold via-white to-gold bg-clip-text text-transparent">
          RANDO
        </h1>
        <p className="text-2xl text-gray-300 mb-2">Chat with random people</p>
        <p className="text-gray-400">100% free • Anonymous option</p>
      </div>

      {/* Main Action */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Big Chat Button */}
        <div className="text-center mb-8 w-full max-w-2xl">
          <button
            onClick={handleQuickChat}
            disabled={loading}
            className="bg-gradient-to-r from-gold to-coral text-dark text-3xl font-bold px-12 py-6 rounded-2xl shadow-2xl hover:scale-105 transition-transform disabled:opacity-50 w-full"
          >
            {loading ? 'Loading...' : '🎯 START RANDOM CHAT'}
          </button>
          <p className="text-gray-400 mt-4">No account needed • Instant matching • Free forever</p>
        </div>

        {/* Optional Auth */}
        <div className="w-full max-w-md mt-8">
          {!showAuth ? (
            <div className="text-center">
              <button
                onClick={() => setShowAuth(true)}
                className="text-gold hover:text-gold/80 text-lg"
              >
                Or create account to save chats & get features
              </button>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6">
              <div className="flex border-b border-gray-800 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 font-bold ${isLogin ? 'text-gold border-b-2 border-gold' : 'text-gray-400'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 font-bold ${!isLogin ? 'text-gold border-b-2 border-gold' : 'text-gray-400'}`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username (optional)"
                    className="input-field"
                  />
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="input-field"
                  required
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  className="input-field"
                  required
                  minLength={6}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-secondary w-full py-3"
                >
                  {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAuth(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  ← Back to quick chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simple Footer */}
      <div className="py-8 text-center text-gray-500 text-sm px-4">
        <p>Chat randomly • No subscriptions • Safe & moderated</p>
      </div>
    </div>
  );
}