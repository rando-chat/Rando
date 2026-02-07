// app/chat/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MatchmakingQueue } from '@/components/matchmaking/MatchmakingQueue'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { supabase } from '@/lib/database/client'
import { useToast } from '@/components/ui/toast'

type ChatSession = {
  id: string
  user1_id: string
  user2_id: string
  user1_display_name: string
  user2_display_name: string
  status: 'active' | 'ended' | 'reported' | 'banned'
  match_score: number
  shared_interests: string[]
  started_at: string
  ended_at: string | null
}

export default function ChatPage() {
  const router = useRouter()
  const { user, isLoading: userLoading, isGuest, guestSession } = useUser()
  const { toast } = useToast()
  
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [isInQueue, setIsInQueue] = useState(false)
  const [queueId, setQueueId] = useState<string | null>(null)
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(30)
  const [pageLoading, setPageLoading] = useState(true)
  const [interests, setInterests] = useState<string[]>([])
  
  const queueCheckRef = useRef<NodeJS.Timeout>()

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user && !guestSession) {
      router.push('/')
    }
  }, [userLoading, user, guestSession, router])

  // Fetch user interests if registered
  useEffect(() => {
    if (user && !userLoading) {
      fetchUserInterests()
    }
  }, [user, userLoading])

  // Check for existing chat sessions
  useEffect(() => {
    if (user || guestSession) {
      checkExistingSessions()
    }
  }, [user, guestSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueCheckRef.current) {
        clearInterval(queueCheckRef.current)
      }
    }
  }, [])

  const fetchUserInterests = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('interests')
        .eq('id', user?.id)
        .single()
      
      if (data?.interests) {
        setInterests(data.interests)
      }
    } catch (error) {
      console.error('Error fetching interests:', error)
    }
  }

  const checkExistingSessions = async () => {
    try {
      const userId = user?.id || guestSession?.guest_id
      if (!userId) return

      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (sessions && sessions.length > 0) {
        setActiveSession(sessions[0])
        
        // Subscribe to session updates
        subscribeToSession(sessions[0].id)
      } else {
        // Check if user is in queue
        checkQueueStatus()
      }
    } catch (error) {
      console.error('Error checking sessions:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const checkQueueStatus = async () => {
    try {
      const userId = user?.id || guestSession?.guest_id
      const isGuestUser = !!guestSession

      const { data: queueData } = await supabase
        .from('matchmaking_queue')
        .select('id, estimated_wait_time')
        .eq('user_id', userId)
        .eq('is_guest', isGuestUser)
        .is('matched_at', null)
        .maybeSingle()

      if (queueData) {
        setIsInQueue(true)
        setQueueId(queueData.id)
        setEstimatedWaitTime(queueData.estimated_wait_time || 30)
        
        // Start polling for match
        startQueuePolling()
      }
    } catch (error) {
      console.error('Error checking queue:', error)
    }
  }

  const startQueuePolling = () => {
    if (queueCheckRef.current) {
      clearInterval(queueCheckRef.current)
    }

    queueCheckRef.current = setInterval(async () => {
      try {
        const userId = user?.id || guestSession?.guest_id
        const isGuestUser = !!guestSession

        // Check if matched
        const { data: queueData } = await supabase
          .from('matchmaking_queue')
          .select('matched_at, estimated_wait_time')
          .eq('user_id', userId)
          .eq('is_guest', isGuestUser)
          .maybeSingle()

        if (queueData?.matched_at) {
          // Found a match!
          clearInterval(queueCheckRef.current)
          setIsInQueue(false)
          
          // Fetch the new session
          checkExistingSessions()
          
          toast({
            title: 'Match found!',
            description: 'You have been matched with someone.',
            variant: 'success'
          })
        } else if (queueData?.estimated_wait_time !== estimatedWaitTime) {
          setEstimatedWaitTime(queueData?.estimated_wait_time || 30)
        }
      } catch (error) {
        console.error('Error polling queue:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  const subscribeToSession = (sessionId: string) => {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          const updatedSession = payload.new as ChatSession
          if (updatedSession.status !== 'active') {
            // Session ended
            setActiveSession(null)
            toast({
              title: 'Chat ended',
              description: 'The chat session has ended.',
              variant: 'info'
            })
          } else {
            setActiveSession(updatedSession)
          }
        }
      )
      .subscribe()
  }

  const handleJoinQueue = async () => {
    try {
      const response = await fetch('/api/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: interests.length > 0 ? interests : ['music', 'movies', 'gaming'],
          language: 'en',
          looking_for: ['text'],
          match_preferences: { min_age: 18, max_age: 99 }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join queue')
      }

      if (data.in_queue) {
        setIsInQueue(true)
        setQueueId(data.queue_id)
        setEstimatedWaitTime(data.estimated_wait_time)
        startQueuePolling()
        
        toast({
          title: 'Joined queue!',
          description: `Estimated wait: ${data.estimated_wait_time} seconds`,
          variant: 'success'
        })
      } else if (data.match) {
        // Immediate match found
        setActiveSession({
          id: data.match.chat_session_id,
          user1_id: user?.id || guestSession?.guest_id,
          user2_id: data.match.matched_with,
          user1_display_name: user?.user_metadata?.display_name || guestSession?.display_name || 'You',
          user2_display_name: data.match.matched_with,
          status: 'active',
          match_score: data.match.match_score,
          shared_interests: data.match.shared_interests || [],
          started_at: new Date().toISOString(),
          ended_at: null
        })
        
        toast({
          title: 'Match found!',
          description: `You matched with ${data.match.matched_with}`,
          variant: 'success'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleLeaveQueue = async () => {
    try {
      const response = await fetch('/api/matchmaking/join', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave queue')
      }

      if (queueCheckRef.current) {
        clearInterval(queueCheckRef.current)
      }

      setIsInQueue(false)
      setQueueId(null)
      
      toast({
        title: 'Left queue',
        description: 'You have left the matchmaking queue',
        variant: 'info'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleEndChat = async () => {
    if (!activeSession) return

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          end_reason: 'User ended chat'
        })
        .eq('id', activeSession.id)

      if (error) throw error

      setActiveSession(null)
      
      toast({
        title: 'Chat ended',
        description: 'You have ended the chat session',
        variant: 'info'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to end chat',
        variant: 'destructive'
      })
    }
  }

  if (userLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <Card className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="pt-8">
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!user && !guestSession) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Rando Chat
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isGuest ? 'secondary' : 'default'}>
                {isGuest ? 'Guest' : 'Registered'}
              </Badge>
              <span className="text-sm text-gray-600">
                {isGuest ? guestSession?.display_name : user?.user_metadata?.display_name}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {activeSession && (
              <Button
                variant="outline"
                onClick={handleEndChat}
                className="border-coral-300 text-coral-700 hover:bg-coral-50"
              >
                End Chat
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-gray-600"
            >
              Home
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Queue/Status */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              {activeSession ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Active Chat
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">With:</span>
                        <span className="font-medium">
                          {activeSession.user1_id === (user?.id || guestSession?.guest_id) 
                            ? activeSession.user2_display_name
                            : activeSession.user1_display_name}
                        </span>
                      </div>
                      {activeSession.match_score && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Match Score:</span>
                          <Badge variant="secondary">
                            {activeSession.match_score}/100
                          </Badge>
                        </div>
                      )}
                      {activeSession.shared_interests && activeSession.shared_interests.length > 0 && (
                        <div>
                          <span className="text-gray-600 block mb-1">Shared Interests:</span>
                          <div className="flex flex-wrap gap-1">
                            {activeSession.shared_interests.map((interest, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Chat started: {new Date(activeSession.started_at).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Be respectful and follow community guidelines
                    </p>
                  </div>
                </div>
              ) : isInQueue ? (
                <MatchmakingQueue
                  queueId={queueId}
                  estimatedWaitTime={estimatedWaitTime}
                  onLeaveQueue={handleLeaveQueue}
                />
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">💬</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Start a New Chat
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Find someone to chat with based on shared interests
                    </p>
                  </div>
                  
                  {interests.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Your interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest, idx) => (
                          <Badge key={idx} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleJoinQueue}
                    className="w-full py-6 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    Find Someone to Chat With
                  </Button>
                  
                  <p className="text-center text-sm text-gray-500">
                    Average wait time: 30 seconds
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-2">
            {activeSession ? (
              <ChatInterface
                sessionId={activeSession.id}
                otherUserName={
                  activeSession.user1_id === (user?.id || guestSession?.guest_id)
                    ? activeSession.user2_display_name
                    : activeSession.user1_display_name
                }
                sharedInterests={activeSession.shared_interests || []}
              />
            ) : (
              <Card className="p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                  <span className="text-5xl">👋</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Ready to Chat?
                </h3>
                <p className="text-gray-600 mb-8 max-w-md">
                  Join the matchmaking queue to find someone with similar interests.
                  We use smart matching to connect you with compatible people.
                </p>
                <Button
                  onClick={handleJoinQueue}
                  size="xl"
                  className="bg-gradient-to-r from-coral-500 to-pink-500 hover:from-coral-600 hover:to-pink-600"
                >
                  Join Matchmaking Queue
                </Button>
                
                {isInQueue && (
                  <div className="mt-8">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 font-medium">In queue...</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Finding the perfect match for you
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="#" className="text-purple-600 hover:underline">View safety guidelines</a>
            {' '}• Report inappropriate behavior using the report button in chat
          </p>
          <p className="text-xs text-gray-400 mt-2">
            © {new Date().getFullYear()} Rando Chat • All chats are moderated
          </p>
        </div>
      </div>
    </div>
  )
}