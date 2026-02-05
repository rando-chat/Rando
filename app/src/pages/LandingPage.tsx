import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { signIn, signUp } from '@/lib/supabase/auth';
import { trackAnalytics } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        result = await signUp(email, password, username.trim());
      }

      if (result.success) {
        toast.success(isLogin ? 'Welcome back!' : 'Account created!');
        await trackAnalytics(isLogin ? 'login' : 'signup', {
          email,
          method: 'email',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '💬', title: 'Text Chat Only', desc: 'Focus on meaningful conversations' },
    { icon: '🔒', title: 'Link Blocking', desc: 'All URLs blocked for safety' },
    { icon: '🎓', title: 'Student Discount', desc: '50% off with .edu email' },
    { icon: '🆓', title: 'Completely Free', desc: 'No hidden fees, no subscriptions' },
    { icon: '🌐', title: 'Global Community', desc: 'Chat with people worldwide' },
    { icon: '⚡', title: 'Real-time', desc: 'Instant messaging with WebSockets' },
  ];

  if (user) {
    window.location.href = '/chat';
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-gold via-white to-gold bg-clip-text text-transparent">
            RANDO
          </h1>
          <p className="text-2xl text-gray-300 mb-4">Chat Randomly. Meet Authentically.</p>
          <p className="text-gray-400">100% Free • No Subscriptions • Real Connections</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Auth Form */}
          <div className="glass rounded-3xl p-8">
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
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a unique username"
                    className="input-field"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-gold hover:text-gold/80"
                    onClick={() => toast.success('Password reset coming soon!')}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-lg"
              >
                {loading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-800">
              <h4 className="font-bold mb-3">Why join RANDO?</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>✅ No credit card required</li>
                <li>✅ Free forever tier</li>
                <li>✅ Student discounts available</li>
                <li>✅ Safe and moderated community</li>
                <li>✅ Instant matching</li>
              </ul>
            </div>
          </div>

          {/* Features */}
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center">Everything You Need, 100% Free</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="glass rounded-xl p-4 hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Pricing Comparison */}
            <div className="mt-8 glass rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Transparent Pricing</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="text-2xl font-bold text-gold mb-2">$0</div>
                  <div className="font-bold mb-2">Free</div>
                  <div className="text-xs text-gray-400">Forever</div>
                </div>
                <div className="p-4 border-2 border-gold rounded-xl">
                  <div className="text-2xl font-bold text-gold mb-2">$2.49</div>
                  <div className="font-bold mb-2">Student</div>
                  <div className="text-xs text-gray-400">50% off</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl font-bold text-gold mb-2">$4.99</div>
                  <div className="font-bold mb-2">Premium</div>
                  <div className="text-xs text-gray-400">All features</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 glass rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Join Our Community</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-gold">1M+</div>
                  <div className="text-sm text-gray-400">Messages Sent</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gold">50K+</div>
                  <div className="text-sm text-gray-400">Happy Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gold">24/7</div>
                  <div className="text-sm text-gray-400">Active Support</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gold">100%</div>
                  <div className="text-sm text-gray-400">Free Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-400 text-sm">
          <p>© 2024 RANDO Chat Platform. Built with ❤️ for authentic connections.</p>
          <p className="mt-2">No hidden fees. No subscriptions. Just real conversations.</p>
        </div>
      </div>
    </div>
  );
}