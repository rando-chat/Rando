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
  const [isGuest, setIsGuest] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ id: '', username: 'Guest' });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      setLoading(true);
      if (user) {
        // Authenticated user
        setIsGuest(false);
        if (!user.email_verified) {
          setShowVerification(true);
        }
      } else {
        // Check for guest session
        const guestId = localStorage.getItem('rando_guest_id');
        const guestUsername = localStorage.getItem('rando_guest_username') || 'Guest';
        
        if (guestId) {
          setIsGuest(true);
          setGuestInfo({ 
            id: guestId, 
            username: guestUsername 
          });
        } else {
          // No user and no guest - go back to landing
          router.push('/');
          return;
        }
      }
      setLoading(false);
    };

    checkSession();

    // Subscribe to online users
    const subscribeToUsers = async () => {
      try {
        const channel = await realtimeService.subscribeToOnlineUsers((userIds) => {
          setOnlineUsers(userIds);
          console.log('Online users updated:', userIds.length, 'users');
        });
        channelRef.current = channel;
      } catch (error) {
        console.error('Failed to subscribe to online users:', error);
        // Fallback
        if (isGuest) {
          setOnlineUsers(['guest_' + guestInfo.id]);
        }
      }
    };

    subscribeToUsers();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [user, isGuest, guestInfo.id, router]);

  const handleMatchFound = (sessionId: string) => {
    setCurrentSession(sessionId);
    if (isGuest) {
      trackAnalytics('guest_chat_started', { sessionId });
    } else {
      trackAnalytics('chat_started', { sessionId });
    }
  };

  const handleEndSession = () => {
    setCurrentSession(null);
    if (isGuest) {
      trackAnalytics('guest_chat_ended', {});
    } else {
      trackAnalytics('chat_ended', {});
    }
  };

  const handleSignOut = async () => {
    // Cleanup
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (isGuest) {
      // Clear guest session
      localStorage.removeItem('rando_guest_id');
      localStorage.removeItem('rando_guest_username');
      toast.success('Guest session ended');
    } else {
      await signOut();
    }
    
    router.push('/');
  };

  const goToProfile = () => {
    if (isGuest) {
      toast.success('Create an account to access profile features');
      router.push('/');
    } else {
      router.push('/profile');
    }
  };

  const getDisplayName = () => {
    if (isGuest) return guestInfo.username;
    return user?.username || 'User';
  };

  const getTier = () => {
    if (isGuest) return 'guest';
    return user?.tier || 'free';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
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
              <span>
                {onlineUsers.length > 0 
                  ? `${onlineUsers.length} user${onlineUsers.length !== 1 ? 's' : ''} online` 
                  : 'Connecting...'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <div className="font-bold">{getDisplayName()}</div>
              <div className="text-xs text-gray-400">{getTier()} {isGuest && '(Guest)'}</div>
            </div>
            <button
              onClick={goToProfile}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-gray-800 transition-colors"
              title={isGuest ? "Create account for profile" : "Profile"}
            >
              👤
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg border border-gray-700 hover:border-coral hover:text-coral transition-all"
            >
              {isGuest ? 'End Chat' : 'Sign Out'}
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
            isGuest={isGuest}
            guestId={isGuest ? guestInfo.id : undefined}
          />
        ) : (
          <Matchmaking 
            onMatchFound={handleMatchFound}
            isGuest={isGuest}
            guestId={isGuest ? guestInfo.id : undefined}
          />
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
          {isGuest && (
            <p className="mt-2 text-gold">
              ✨ Guest session • Chats won't be saved •{' '}
              <button 
                onClick={() => router.push('/')}
                className="underline hover:text-gold/80"
              >
                Create account to save chats
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}