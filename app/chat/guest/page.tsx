// app/chat/guest/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Matchmaking from '@/components/Matchmaking';
import ChatInterface from '@/components/ChatInterface';
import toast from 'react-hot-toast';

export default function GuestChatPage() {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [guestId] = useState(`guest_${Date.now()}_${Math.random().toString(36).slice(-4)}`);

  const handleMatchFound = (sessionId: string) => {
    setCurrentSession(sessionId);
    toast.success('Connected to a random person!');
  };

  const handleEndSession = () => {
    setCurrentSession(null);
    toast('Chat ended. Start a new one?');
  };

  const goToRegister = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Guest Header */}
      <div className="glass border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold to-coral flex items-center justify-center">
                <span className="text-dark font-bold">G</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">RANDO Guest</h1>
                <p className="text-xs text-gray-400">ID: {guestId.slice(0, 8)}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span>Anonymous mode</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={goToRegister}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-gold text-dark font-bold hover:opacity-90 transition-opacity"
            >
              Create Account
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
          <Matchmaking onMatchFound={handleMatchFound} isGuest={true} />
        )}
      </div>

      {/* Guest Info */}
      <div className="glass border-t border-gray-800 px-6 py-4 mt-8">
        <div className="text-center text-sm text-gray-400">
          <p>💬 <span className="text-gold">Guest Chat</span> • Messages not saved • No profile</p>
          <p className="mt-2">
            <button
              onClick={goToRegister}
              className="text-gold hover:text-gold/80 underline"
            >
              Create free account
            </button>
            {' '}to save chats, get notifications, and earn badges
          </p>
        </div>
      </div>
    </div>
  );
}