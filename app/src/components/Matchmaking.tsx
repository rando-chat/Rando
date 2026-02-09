// app/src/components/Matchmaking.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface MatchmakingProps {
  onMatchFound: (sessionId: string) => void;
  isGuest?: boolean;
  guestId?: string;
}

export default function Matchmaking({ onMatchFound, isGuest = false, guestId }: MatchmakingProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [lookingFor, setLookingFor] = useState<'text' | 'video'>('text');
  const [interests, setInterests] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const interestsList = [
    'Gaming', 'Music', 'Movies', 'Sports', 'Technology',
    'Art', 'Travel', 'Food', 'Books', 'Fitness',
    'Fashion', 'Science', 'Business', 'Education', 'Health'
  ];

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const startSearch = async () => {
    if (!user && !isGuest) {
      toast.error('Please start a chat session first');
      return;
    }

    setSearching(true);
    setTimer(0);
    setMatchFound(false);

    const userId = isGuest ? guestId : user?.id;
    const username = isGuest ? `Guest_${guestId?.slice(-4) || 'User'}` : user?.username || 'User';

    if (!userId) {
      toast.error('Unable to start search');
      setSearching(false);
      return;
    }

    console.log('🔍 Starting matchmaking search:', { userId, username, isGuest });
    toast.success('🔍 Searching for someone...');

    try {
      // Clean up any existing entry
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', userId);

      // Join queue in database
      const { error: insertError } = await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: userId,
          username: username,
          looking_for: lookingFor,
          is_guest: isGuest,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to join queue:', insertError);
        toast.error('Failed to start search');
        setSearching(false);
        return;
      }

      // Start polling for matches
      startPolling(userId);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to start search');
      setSearching(false);
    }
  };

  const startPolling = (userId: string) => {
    let pollCount = 0;
    const maxPolls = 45; // 45 seconds
    
    const interval = setInterval(async () => {
      if (!searching || matchFound || pollCount >= maxPolls) {
        clearInterval(interval);
        if (pollCount >= maxPolls && !matchFound) {
          toast.error('No match found. Try again!');
          await leaveQueue(userId);
          setSearching(false);
        }
        return;
      }

      pollCount++;
      setTimer(pollCount);

      try {
        // Check if someone else is looking for a match
        const { data: waitingUsers, error } = await supabase
          .from('matchmaking_queue')
          .select('*')
          .neq('user_id', userId)
          .eq('looking_for', lookingFor)
          .is('matched_at', null)
          .order('created_at', { ascending: true })
          .limit(1);

        if (error) {
          console.error('Poll error:', error);
          return;
        }

        if (waitingUsers && waitingUsers.length > 0) {
          // Found a match!
          clearInterval(interval);
          await createMatch(userId, waitingUsers[0]);
        }

      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    setPollInterval(interval);
  };

  const createMatch = async (userId: string, match: any) => {
    try {
      setMatchFound(true);

      // Generate UUID for session
      const sessionId = uuidv4();
      
      console.log('Creating match:', {
        userId,
        matchUserId: match.user_id,
        sessionId,
        isGuest,
        matchIsGuest: match.is_guest
      });

      // Create chat session in database
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          id: sessionId,
          user1_id: match.user_id,
          user2_id: userId,
          session_type: lookingFor,
          started_at: new Date().toISOString(),
          is_guest1: match.is_guest,
          is_guest2: isGuest
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw sessionError;
      }

      // Remove both users from queue
      await Promise.all([
        supabase
          .from('matchmaking_queue')
          .update({ matched_at: new Date().toISOString() })
          .eq('user_id', match.user_id),
        supabase
          .from('matchmaking_queue')
          .delete()
          .eq('user_id', userId)
      ]);

      toast.success('✅ Match found! Connecting...');

      setTimeout(() => {
        onMatchFound(sessionId);
      }, 1500);

    } catch (error) {
      console.error('Create match error:', error);
      toast.error('Failed to create match');
      setSearching(false);
      setMatchFound(false);
    }
  };

  const leaveQueue = async (userId: string) => {
    try {
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('Leave queue error:', error);
    }
  };

  const stopSearch = async () => {
    const userId = isGuest ? guestId : user?.id;
    
    if (userId) {
      await leaveQueue(userId);
    }

    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    setSearching(false);
    setTimer(0);
    setMatchFound(false);
    
    toast('Search stopped');
  };

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (searching && !matchFound) {
      timerInterval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    };
  }, [searching, matchFound, pollInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-2">
        {isGuest ? 'Anonymous Chat' : 'Find Someone to Chat With'}
      </h2>
      <p className="text-gray-400 text-center mb-8">
        {isGuest 
          ? 'Chat with random people. No account needed.'
          : 'Meet interesting people from around the world'}
      </p>

      {isGuest && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/20 to-gold/20 rounded-xl border border-gold/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">🎭</span>
            <span className="font-bold text-gold">Guest Mode</span>
          </div>
          <p className="text-sm text-center text-gray-300">
            Chat anonymously • No sign up required • Messages not saved
          </p>
          <div className="text-center mt-2">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gold hover:text-gold/80 underline"
            >
              Create free account for more features
            </button>
          </div>
        </div>
      )}

      {!searching ? (
        <>
          {/* Chat Type Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">What type of chat?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setLookingFor('text')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  lookingFor === 'text'
                    ? 'border-gold bg-gold bg-opacity-10'
                    : 'border-gray-700 hover:border-gold'
                }`}
              >
                <div className="text-4xl mb-2">💬</div>
                <h4 className="font-bold text-lg mb-2">Text Chat</h4>
                <p className="text-gray-400 text-sm">
                  {isGuest 
                    ? 'Anonymous text conversation'
                    : 'Classic text-based conversation. Safe and anonymous.'}
                </p>
              </button>
            </div>
          </div>

          {/* Interests Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Select your interests (optional)</h3>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                    interests.includes(interest)
                      ? 'bg-gold text-dark border-gold'
                      : 'border-gray-700 hover:border-gold'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-3">
              {interests.length === 0
                ? 'No interests selected - will match with anyone'
                : `${interests.length} interest${interests.length === 1 ? '' : 's'} selected`}
            </p>
          </div>

          <button
            onClick={startSearch}
            className="btn-primary w-full py-4 text-lg"
          >
            {isGuest ? 'Start Anonymous Chat' : 'Start Random Chat'}
          </button>
        </>
      ) : (
        <div className="text-center">
          <div className="animate-pulse-slow text-6xl mb-6">
            {matchFound ? '✅' : '🔍'}
          </div>

          {matchFound ? (
            <>
              <h3 className="text-2xl font-bold mb-2 text-gold">Match Found!</h3>
              <p className="text-gray-400 mb-6">
                Starting your chat...
              </p>
              <div className="w-20 h-20 mx-auto mb-6 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-2">Looking for a match...</h3>
              <p className="text-gray-400 mb-6">
                {isGuest 
                  ? 'Finding someone random for you to chat with'
                  : 'Searching for someone with similar interests'}
              </p>

              <div className="space-y-4 mb-8">
                <div>
                  <div className="text-3xl font-bold text-gold mb-2">{formatTime(timer)}</div>
                  <p className="text-gray-400">Time searching</p>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">
                    {timer < 5 ? 'Quick match' : 'Active search'}
                  </div>
                  <p className="text-gray-400">Status</p>
                </div>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-primary to-gold h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(timer * 2, 100)}%` }}
                ></div>
              </div>

              <button
                onClick={stopSearch}
                className="btn-secondary w-full py-3"
              >
                Stop Searching
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gold">100%</div>
            <div className="text-gray-400 text-sm">Free</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">24/7</div>
            <div className="text-gray-400 text-sm">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gold">
              {isGuest ? '🎭' : 'Safe'}
            </div>
            <div className="text-gray-400 text-sm">
              {isGuest ? 'Anonymous' : 'Moderated'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}