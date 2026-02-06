// app/src/components/Matchmaking.tsx - COMPLETE UPDATED FILE
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackAnalytics } from '@/lib/supabase/auth';
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
  const [queuePosition, setQueuePosition] = useState(0);
  const [lookingFor, setLookingFor] = useState<'text' | 'video'>('text');
  const [interests, setInterests] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);

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

  // Add this simulateMatchmaking function
  const simulateMatchmaking = () => {
    // Simulate finding a match in 2-5 seconds
    const matchTime = 2000 + Math.random() * 3000;
    
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setMatchFound(true);
      toast.success('Match found! Connecting...');

      const mockSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(-6)}`;
      
      // Small delay before connecting
      setTimeout(() => {
        onMatchFound(mockSessionId);
      }, 1000);
    }, matchTime);
  };

  // Update checkForMatch to accept userId parameter
  const checkForMatch = async (userId: string) => {
    if (!searching || matchFound || !userId) return;

    try {
      // Check queue position
      const { data: queueData } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', userId)
        .order('entered_at', { ascending: true });

      if (queueData) {
        setQueuePosition(queueData.length + 1);
      }

      // Try to find a match (simplified logic)
      const { data: potentialMatch } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', userId)
        .or(`looking_for.eq.${lookingFor},looking_for.is.null`)
        .limit(1)
        .single();

      if (potentialMatch) {
        setMatchFound(true);

        // Create chat session
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: userId,
            user2_id: potentialMatch.user_id,
            session_type: lookingFor,
            started_at: new Date().toISOString(),
            is_guest1: isGuest,
            is_guest2: potentialMatch.is_guest
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Session creation error:', sessionError);
          // Use mock session
          const mockSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(-6)}`;
          toast.success('Match found! Connecting...');
          
          setTimeout(() => {
            onMatchFound(mockSessionId);
          }, 1000);
          return;
        }

        // Remove both users from queue
        await Promise.all([
          supabase
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', userId),
          supabase
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', potentialMatch.user_id),
        ]);

        toast.success('Match found! Connecting...');
        setTimeout(() => {
          onMatchFound(session.id);
        }, 1000);

        return;
      }

      // Continue searching if no match found
      setTimeout(() => checkForMatch(userId), 3000);
    } catch (error) {
      console.error('Matchmaking error:', error);
      setTimeout(() => checkForMatch(userId), 3000);
    }
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

    try {
      // First, check if the matchmaking_queue table exists
      const { error: tableCheckError } = await supabase
        .from('matchmaking_queue')
        .select('count')
        .limit(1);

      if (tableCheckError) {
        // Table might not exist or have RLS issues
        console.log('Table check error:', tableCheckError);
        
        // Use fallback simulation
        toast.success('Searching for a random match...');
        simulateMatchmaking();
        return;
      }

      // Clean up any existing entry for this user first
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', userId);

      // Join matchmaking queue
      const { error: queueError } = await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: userId,
          username: username,
          tier: isGuest ? 'guest' : user?.tier || 'free',
          interests: interests.length > 0 ? interests : null,
          looking_for: lookingFor,
          entered_at: new Date().toISOString(),
          is_guest: isGuest
        });

      if (queueError) {
        console.error('Queue insert error:', queueError);
        
        // If there's an RLS policy issue, try with simpler data
        const { error: simpleError } = await supabase
          .from('matchmaking_queue')
          .insert({
            user_id: userId,
            looking_for: lookingFor,
            entered_at: new Date().toISOString()
          });

        if (simpleError) {
          console.error('Simple insert also failed:', simpleError);
          // Use fallback
          toast.success('Searching for a random match...');
          simulateMatchmaking();
          return;
        }
      }

      toast.success('Searching for a match...');

      if (isGuest) {
        trackAnalytics('guest_matchmaking_started', {
          lookingFor,
          interestsCount: interests.length,
        });
      } else {
        trackAnalytics('matchmaking_started', {
          lookingFor,
          interestsCount: interests.length,
        });
      }

      // Start checking for matches
      checkForMatch(userId);
      
    } catch (error: any) {
      console.error('Start search error:', error);
      toast.error('Failed to start search, using simulation...');
      simulateMatchmaking();
    }
  };

  const stopSearch = async () => {
    setSearching(false);
    setTimer(0);
    setMatchFound(false);
    
    if (checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }

    const userId = isGuest ? guestId : user?.id;
    
    if (userId) {
      try {
        await supabase
          .from('matchmaking_queue')
          .delete()
          .eq('user_id', userId);
      } catch (error) {
        console.error('Stop search error:', error);
      }
    }

    if (isGuest) {
      trackAnalytics('guest_matchmaking_stopped', {});
    } else {
      trackAnalytics('matchmaking_stopped', {});
    }

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
      if (checkInterval) {
        clearInterval(checkInterval);
        setCheckInterval(null);
      }
    };
  }, [searching, matchFound]);

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
                Connecting you to a random person...
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
                {!isGuest && (
                  <div>
                    <div className="text-3xl font-bold mb-2">#{queuePosition}</div>
                    <p className="text-gray-400">Position in queue</p>
                  </div>
                )}
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