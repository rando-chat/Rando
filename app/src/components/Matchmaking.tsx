// app/src/components/Matchmaking.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackAnalytics } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

interface MatchmakingProps {
  onMatchFound: (sessionId: string) => void;
  isGuest?: boolean;
}

export default function Matchmaking({ onMatchFound, isGuest = false }: MatchmakingProps) {
  const { user } = useAuth();
  const [searching, setSearching] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [lookingFor, setLookingFor] = useState<'text' | 'video'>('text');
  const [interests, setInterests] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [matchFound, setMatchFound] = useState(false);

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
    if (isGuest) {
      // Guest matchmaking (simulated)
      setSearching(true);
      setTimer(0);
      setMatchFound(false);
      
      toast.success('Searching for a random match...');
      
      await trackAnalytics('guest_matchmaking_started', {
        lookingFor,
        interestsCount: interests.length,
      });

      // Simulate finding a match in 2-5 seconds
      const matchTime = 2000 + Math.random() * 3000;
      setTimeout(() => {
        const mockSessionId = `guest_session_${Date.now()}_${Math.random().toString(36).slice(-6)}`;
        setMatchFound(true);
        toast.success('Match found! Connecting...');
        
        // Small delay before redirecting to chat
        setTimeout(() => {
          onMatchFound(mockSessionId);
        }, 1000);
      }, matchTime);

      return;
    }

    // Authenticated user matchmaking
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setSearching(true);
    setTimer(0);
    setMatchFound(false);

    // Join matchmaking queue
    const { error: queueError } = await supabase
      .from('matchmaking_queue')
      .insert({
        user_id: user.id,
        tier: user.tier,
        interests,
        looking_for: lookingFor,
        entered_at: new Date().toISOString(),
      });

    if (queueError) {
      console.error('Queue error:', queueError);
      toast.error('Failed to join queue');
      setSearching(false);
      return;
    }

    await trackAnalytics('matchmaking_started', {
      lookingFor,
      interestsCount: interests.length,
    });

    // Start checking for matches
    checkForMatch();
  };

  const stopSearch = async () => {
    setSearching(false);
    setTimer(0);
    setMatchFound(false);

    if (!isGuest && user) {
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', user.id);

      await trackAnalytics('matchmaking_stopped', {});
    }
    
    toast('Search stopped');
  };

  const checkForMatch = async () => {
    if (!searching || !user || isGuest || matchFound) return;

    try {
      // Check queue position
      const { data: queueData } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', user.id)
        .order('entered_at', { ascending: true });

      if (queueData) {
        setQueuePosition(queueData.length + 1);
      }

      // Try to find a match
      const { data: potentialMatch } = await supabase
        .from('matchmaking_queue')
        .select('*, user:users(*)')
        .neq('user_id', user.id)
        .or(`looking_for.eq.${lookingFor},looking_for.is.null`)
        .limit(1)
        .single();

      if (potentialMatch) {
        setMatchFound(true);
        
        // Create chat session
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: user.id,
            user2_id: potentialMatch.user_id,
            session_type: lookingFor,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Remove both users from queue
        await Promise.all([
          supabase
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', user.id),
          supabase
            .from('matchmaking_queue')
            .delete()
            .eq('user_id', potentialMatch.user_id),
        ]);

        await trackAnalytics('match_found', {
          sessionId: session.id,
          matchUserId: potentialMatch.user_id,
          matchTier: potentialMatch.user.tier,
        });

        toast.success('Match found! Connecting...');
        
        // Small delay for better UX
        setTimeout(() => {
          onMatchFound(session.id);
        }, 1000);
        
        return;
      }

      // Continue searching if no match found
      setTimeout(checkForMatch, 3000);
    } catch (error) {
      console.error('Matchmaking error:', error);
      setTimeout(checkForMatch, 3000);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (searching) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [searching]);

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
              onClick={() => window.location.href = '/'}
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

          {!isGuest && (
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.href = '/chat/guest'}
                className="text-gold hover:text-gold/80 underline"
              >
                Or try anonymous guest chat
              </button>
            </div>
          )}
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
              {isGuest ? '∞' : 'Safe'}
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