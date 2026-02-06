// app/src/components/Matchmaking.tsx - UPDATED FOR NEW TABLE
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
  const [lookingFor, setLookingFor] = useState<'text' | 'video'>('text');
  const [interests, setInterests] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [checkingForMatch, setCheckingForMatch] = useState(false);

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
    setCheckingForMatch(true);

    const userId = isGuest ? guestId : user?.id;
    const username = isGuest ? `Guest_${guestId?.slice(-4) || 'User'}` : user?.username || 'User';

    if (!userId) {
      toast.error('Unable to start search');
      setSearching(false);
      setCheckingForMatch(false);
      return;
    }

    toast.success('🔍 Searching for someone to chat with...');

    try {
      // 1. Check if someone is already waiting
      const { data: waitingUsers, error: fetchError } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', userId)
        .eq('looking_for', lookingFor)
        .eq('matched', false)
        .order('created_at', { ascending: true })
        .limit(1);

      if (fetchError) {
        console.error('Error checking queue:', fetchError);
        // Continue anyway - maybe no one is waiting yet
      }

      if (waitingUsers && waitingUsers.length > 0) {
        // Found someone waiting! Create match
        const match = waitingUsers[0];
        await createMatch(userId, username, match);
        return;
      }

      // 2. No one waiting, so join the queue
      await joinQueue(userId, username);

      // 3. Wait for someone to match with us
      waitForMatch(userId, username);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to start search');
      setSearching(false);
      setCheckingForMatch(false);
    }
  };

  const joinQueue = async (userId: string, username: string) => {
    try {
      // Remove any existing entry
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', userId);

      // Add to queue
      const { error } = await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: userId,
          username: username,
          looking_for: lookingFor,
          interests: interests.length > 0 ? interests : null,
          is_guest: isGuest,
          tier: isGuest ? 'guest' : user?.tier || 'free',
          matched: false,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Join queue error:', error);
      throw error;
    }
  };

  const waitForMatch = (userId: string, username: string) => {
    let pollCount = 0;
    const maxPolls = 45; // 45 seconds max
    
    const pollInterval = setInterval(async () => {
      if (!searching || matchFound || pollCount >= maxPolls) {
        clearInterval(pollInterval);
        if (pollCount >= maxPolls && !matchFound) {
          toast.error('No match found. Try again!');
          await leaveQueue(userId);
          setSearching(false);
          setCheckingForMatch(false);
        }
        return;
      }

      pollCount++;
      setTimer(pollCount);

      try {
        // Check our queue status
        const { data: queueData, error } = await supabase
          .from('matchmaking_queue')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error || !queueData) {
          // We've been matched or removed!
          clearInterval(pollInterval);
          setMatchFound(true);
          
          // Create session (other user should have created it)
          const sessionId = `chat_${Date.now()}_${userId.slice(-6)}`;
          toast.success('✅ Match found! Connecting...');
          
          setTimeout(() => {
            onMatchFound(sessionId);
          }, 1500);
          return;
        }

        if (queueData.matched && queueData.session_id) {
          // We've been officially matched
          clearInterval(pollInterval);
          await completeMatch(queueData.session_id);
        }

      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 1000);
  };

  const createMatch = async (userId: string, username: string, match: any) => {
    try {
      setMatchFound(true);
      setCheckingForMatch(false);

      // Create session ID
      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).slice(-8)}`;
      
      // Mark both users as matched
      await Promise.all([
        supabase
          .from('matchmaking_queue')
          .update({ 
            matched: true,
            matched_with: userId,
            session_id: sessionId
          })
          .eq('user_id', match.user_id),
        supabase
          .from('matchmaking_queue')
          .delete()
          .eq('user_id', userId)
      ]);

      // Create chat session
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          id: sessionId,
          user1_id: match.user_id,
          user2_id: userId,
          session_type: lookingFor,
          started_at: new Date().toISOString(),
          is_guest1: match.is_guest,
          is_guest2: isGuest,
          total_messages: 0
        });

      if (sessionError) {
        console.error('Session error:', sessionError);
        // Continue anyway
      }

      toast.success(`✅ Matched with ${match.username || 'someone'}!`);
      
      if (isGuest) {
        trackAnalytics('guest_match_found', { sessionId });
      } else {
        trackAnalytics('match_found', { sessionId });
      }

      setTimeout(() => {
        onMatchFound(sessionId);
      }, 1500);

    } catch (error) {
      console.error('Create match error:', error);
      toast.error('Failed to create match');
      setSearching(false);
      setCheckingForMatch(false);
    }
  };

  const completeMatch = async (sessionId: string) => {
    try {
      setMatchFound(true);
      setCheckingForMatch(false);

      toast.success('✅ Someone found you! Connecting...');
      
      setTimeout(() => {
        onMatchFound(sessionId);
      }, 1500);

    } catch (error) {
      console.error('Complete match error:', error);
      toast.error('Failed to connect');
      setSearching(false);
      setCheckingForMatch(false);
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

    setSearching(false);
    setTimer(0);
    setMatchFound(false);
    setCheckingForMatch(false);
    
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
                    {checkingForMatch ? 'Active search' : 'Waiting...'}
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