// app/chat/guest/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Matchmaking from '@/components/Matchmaking';
import ChatInterface from '@/components/ChatInterface';
import toast from 'react-hot-toast';

export default function GuestChatPage() {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string>('');
  const [guestUsername, setGuestUsername] = useState<string>('');

  useEffect(() => {
    // Get or create guest session
    const storedGuestId = localStorage.getItem('rando_guest_id');
    const storedGuestUsername = localStorage.getItem('rando_guest_username');
    
    if (storedGuestId && storedGuestUsername) {
      setGuestId(storedGuestId);
      setGuestUsername(storedGuestUsername);
    } else {
      const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newGuestUsername = `Guest_${Math.random().toString(36).substr(2, 6)}`;
      
      localStorage.setItem('rando_guest_id', newGuestId);
      localStorage.setItem('rando_guest_username', newGuestUsername);
      
      setGuestId(newGuestId);
      setGuestUsername(newGuestUsername);
    }
  }, []);

  const handleMatchFound = (sessionId: string) => {
    setCurrentSession(sessionId);
    toast.success('Connected to chat!');
  };

  const handleEndSession = () => {
    setCurrentSession(null);
    toast.success('Chat ended');
  };

  const handleSignOut = () => {
    localStorage.removeItem('rando_guest_id');
    localStorage.removeItem('rando_guest_username');
    router.push('/');
  };

  if (!guestId) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Setting up guest session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Top Bar */}
      <div className="glass border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
              <span className="text-dark font-bold">R</span>
            </div>
            <h1 className="text-xl font-bold">RANDO</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <div className="font-bold">{guestUsername}</div>
              <div className="text-xs text-gray-400">guest</div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg border border-gray-700 hover:border-coral hover:text-coral transition-all"
            >
              End Chat
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
            isGuest={true}
            guestId={guestId}
          />
        ) : (
          <Matchmaking 
            onMatchFound={handleMatchFound}
            isGuest={true}
            guestId={guestId}
          />
        )}
      </div>

      {/* Bottom Info */}
      <div className="glass border-t border-gray-800 px-6 py-4 mt-8">
        <div className="text-center text-sm text-gray-400">
          <p>RANDO - Chat Randomly. Meet Authentically.</p>
          <p className="mt-2 text-gold">
            ✨ Guest session • Chats won't be saved •{' '}
            <button 
              onClick={() => router.push('/')}
              className="underline hover:text-gold/80"
            >
              Create account to save chats
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}