'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signIn, signUp } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import TierCard from '../components/ui/TierCard';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showTiers, setShowTiers] = useState(false);
  const [authMode, setAuthMode] = useState<'quick' | 'quality'>('quick');
  const [loading, setLoading] = useState(false);

  const handleQuickChat = () => {
    setShowAgeModal(true);
  };

  const confirmAge = () => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('rando_guest_id', guestId);
    
    toast.success('Starting anonymous chat...');
    router.push('/chat');
  };

  const handleQualityChat = () => {
    setAuthMode('quality');
    setShowTiers(true);
  };

  const features = [
    { icon: '🛡️', text: 'Safe & Moderated', color: 'text-[#10B981]' },
    { icon: '⚡', text: 'Instant Matching', color: 'text-[#D4AF37]' },
    { icon: '👥', text: '2.4M+ Users', color: 'text-[#3B82F6]' },
    { icon: '🌍', text: '127 Countries', color: 'text-[#FB6962]' },
  ];

  const tierFeatures = {
    free: [
      { text: 'Basic text chat', included: true },
      { text: 'Anonymous guest mode', included: true },
      { text: 'Safe & moderated', included: true },
      { text: 'Image sharing', included: false },
      { text: 'Save conversations', included: false },
      { text: 'Priority matching', included: false },
    ],
    student: [
      { text: 'Everything in Free', included: true },
      { text: 'Image sharing', included: true },
      { text: 'Save conversations', included: true },
      { text: 'Student verification badge', included: true },
      { text: 'Priority matching', included: true },
      { text: 'No ads', included: true },
    ],
    premium: [
      { text: 'Everything in Student', included: true },
      { text: 'Premium badge', included: true },
      { text: 'Highest priority matching', included: true },
      { text: 'Advanced filters', included: true },
      { text: 'Custom themes', included: true },
      { text: 'Dedicated support', included: true },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2E235E]/10 via-transparent to-[#D4AF37]/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2E235E]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-[#2E235E] to-[#D4AF37] rounded-lg">
              <span className="text-white">💬</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#2E235E] via-[#D4AF37] to-[#FB6962] bg-clip-text text-transparent">
              RANDO
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setShowTiers(true)}
            >
              Pricing
            </Button>
            {!user && (
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-6">
            <span className="text-sm font-medium text-[#D4AF37]">
              ✨ Trusted by 2.4M+ users worldwide
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#2E235E] via-[#D4AF37] to-[#FB6962] bg-clip-text text-transparent">
              Chat Randomly.
            </span>
            <br />
            <span className="text-white">Meet Authentically.</span>
          </h1>
          
          <p className="text-xl text-[#B8B8D1] mb-12 max-w-2xl mx-auto">
            Connect with real people worldwide. No filters, no algorithms—just genuine conversations.
          </p>

          {/* Dual Path Choice */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
            <Card
              variant="default"
              padding="lg"
              hover
              onClick={handleQuickChat}
              className="cursor-pointer text-center"
            >
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-bold mb-2">Quick Chat</h3>
              <p className="text-[#B8B8D1] mb-6">
                Start instantly, no signup needed. Perfect for spontaneous conversations.
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center text-sm">
                  <span className="text-[#10B981] mr-2">✓</span>
                  <span>Instant start</span>
                </div>
                <div className="flex items-center justify-center text-sm">
                  <span className="text-[#10B981] mr-2">✓</span>
                  <span>Anonymous</span>
                </div>
                <div className="flex items-center justify-center text-sm">
                  <span className="text-[#10B981] mr-2">✓</span>
                  <span>No commitment</span>
                </div>
              </div>
              <Button
                variant="default"
                size="lg"
                fullWidth
              >
                ⚡ Start Free Chat
              </Button>
            </Card>

            <Card
              variant="gold"
              padding="lg"
              hover
              onClick={handleQualityChat}
              className="cursor-pointer text-center"
            >
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-bold mb-2">Quality Chat</h3>
              <p className="text-[#B8B8D1] mb-6">
                Better matches, saved conversations, and premium features.
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center text-sm">
                  <span className="text-[#D4AF37] mr-2">★</span>
                  <span>Better matches</span>
                </div>
                <div className="flex items-center justify-center text-sm">
                  <span className="text-[#D4AF37] mr-2">★</span>
                  <span>Save conversations</span>
                </div>
                <div className="flex items-center justify-center text-sm">
                  <span className="text-[#D4AF37] mr-2">★</span>
                  <span>Image sharing</span>
                </div>
              </div>
              <Button
                variant="gold"
                size="lg"
                fullWidth
              >
                🎓 Start Quality Chat
              </Button>
            </Card>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl mb-2 ${feature.color}`}>{feature.icon}</div>
                <p className="text-sm font-medium">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-[#2d2d4a]">
        <div className="text-center text-[#B8B8D1] text-sm">
          <p className="mb-2">🔞 Must be 18+ • 🛡️ Safe & Moderated • 🆓 Completely Free</p>
          <p>© {new Date().getFullYear()} RANDO. Chat responsibly.</p>
        </div>
      </footer>

      {/* Age Verification Modal */}
      <Modal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        title="⚠️ Age Verification Required"
        description="To use RANDO, you must be 18 years or older."
      >
        <div className="space-y-6">
          <div className="p-4 bg-[#252540] rounded-lg">
            <p className="text-[#B8B8D1]">
              This platform contains conversations with strangers. By continuing, 
              you confirm you're at least 18 years old and agree to our{' '}
              <button className="text-[#D4AF37] hover:underline">Terms of Service</button>.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowAgeModal(false)}
            >
              I'm under 18
            </Button>
            <Button
              variant="gold"
              fullWidth
              onClick={confirmAge}
            >
              ✅ I'm 18+
            </Button>
          </div>
          
          <div className="text-center text-sm text-[#B8B8D1]">
            🛡️ Your privacy and safety are our top priority
          </div>
        </div>
      </Modal>

      {/* Tiers Modal */}
      <Modal
        isOpen={showTiers}
        onClose={() => setShowTiers(false)}
        title="✨ Choose Your Plan"
        description="Start with Free, upgrade anytime"
        size="xl"
      >
        <div className="grid md:grid-cols-3 gap-6">
          <TierCard
            tier="free"
            title="Free"
            description="Perfect for trying out"
            price={{ monthly: 0 }}
            features={tierFeatures.free}
            ctaText={
              authMode === 'quick' 
                ? 'Start Quick Chat' 
                : 'Continue with Free'
            }
            onCtaClick={() => {
              if (authMode === 'quick') {
                setShowTiers(false);
                handleQuickChat();
              } else {
                router.push('/signup');
              }
            }}
          />
          
          <TierCard
            tier="student"
            title="Student"
            description="50% discount for students"
            price={{ monthly: 2.49, yearly: 24.99 }}
            features={tierFeatures.student}
            ctaText="Get Student Plan"
            onCtaClick={() => {
              router.push('/student-verify');
            }}
            popular
            featured
          />
          
          <TierCard
            tier="premium"
            title="Premium"
            description="Full experience"
            price={{ monthly: 4.99, yearly: 49.99 }}
            features={tierFeatures.premium}
            ctaText="Go Premium"
            onCtaClick={() => {
              router.push('/premium');
            }}
          />
        </div>
        
        <div className="mt-8 p-4 bg-[#252540] rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-[#10B981]">🛡️</span>
            <div>
              <p className="font-medium">All plans include:</p>
              <p className="text-sm text-[#B8B8D1]">
                Safe moderation, no time limits, and our community guidelines protection.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}