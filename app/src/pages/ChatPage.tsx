// app/src/pages/ChatPage.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import ChatInterface from '@/components/ChatInterface';
import Matchmaking from '@/components/Matchmaking';
import EmailVerification from '@/components/EmailVerification';
import { realtimeService } from '@/lib/supabase/realtime';
import { trackAnalytics } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user) {
      // Check if email needs verification
      if (!user.email_verified) {
        setShowVerification(true);
      }

      // Subscribe to online users
      realtimeService.subscribeToOnlineUsers(setOnlineUsers)
        .then(channel => {
          channelRef.current = channel;
        })
        .catch(error => {
          console.error('Failed to subscribe to online users:', error);
        });

      // Cleanup function
      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
      };
    }
  }, [user]);

  const handleMatchFound = (sessionId: string) => {
    setCurrentSession(sessionId);
    trackAnalytics('chat_started', { sessionId });
  };

  const handleEndSession = () => {
    setCurrentSession(null);
    trackAnalytics('chat_ended', {});
  };

  const handleSignOut = async () => {
    // Unsubscribe from channel before signing out
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    await signOut();
    router.push('/');
  };

  const goToProfile = () => {
    router.push('/profile');
  };

  if (!user) {
    router.push('/');
    return null;
  }

  if (showVerification) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <EmailVerification onVerified={() => setShowVerification(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Top Bar */}
      <div className="glass border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                <span className="text-dark font-bold">R</span>
              </div>
              <h1 className="text-xl font-bold">RANDO</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span>{onlineUsers.length} online</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <div className="font-bold">{user.username}</div>
              <div className="text-xs text-gray-400">{user.tier} tier</div>
            </div>
            <button
              onClick={goToProfile}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-gray-800 transition-colors"
              title="Profile"
            >
              👤
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg border border-gray-700 hover:border-coral hover:text-coral transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        {currentSession ? (
          <ChatInterface
            sessionId={currentSession}
            onEndSession={handleEndSession}
          />
        ) : (
          <Matchmaking onMatchFound={handleMatchFound} />
        )}
      </div>

      {/* Bottom Info */}
      <div className="glass border-t border-gray-800 px-6 py-4 mt-8">
        <div className="text-center text-sm text-gray-400">
          <p>RANDO - Chat Randomly. Meet Authentically.</p>
          <p className="mt-1">
            <span className="text-gold">Free forever</span> • 
            <span className="mx-2">🔒 Link blocking enabled</span> • 
            <span>👮 Content moderated</span>
          </p>
          <div className="mt-3 flex justify-center space-x-6">
            <button
              className="hover:text-gold"
              onClick={() => toast.success('Report system active')}
            >
              Report User
            </button>
            <button
              className="hover:text-gold"
              onClick={() => toast.success('Safety guide coming soon')}
            >
              Safety Guide
            </button>
            <button
              className="hover:text-gold"
              onClick={() => toast.success('Contact form coming soon')}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}