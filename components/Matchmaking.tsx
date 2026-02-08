// components/Matchmaking.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/database/client'
import { useToast } from '@/components/ui/toast'

interface MatchmakingProps {
  guestId?: string
  sessionToken?: string
  displayName?: string
  onMatchFound?: (matchData: {
    sessionId: string
    partnerId: string
    partnerDisplayName: string
    partnerIsGuest: boolean
  }) => void
}

export default function Matchmaking({ guestId, sessionToken, displayName, onMatchFound }: MatchmakingProps) {
  const { toast } = useToast()
  const [isInQueue, setIsInQueue] = useState(false)
  const [queuePosition, setQueuePosition] = useState(0)
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [matchmakingId, setMatchmakingId] = useState<string>()

  // Check if user is already in queue on mount
  useEffect(() => {
    if (guestId) {
      checkQueueStatus()
    }
  }, [guestId])

  const checkQueueStatus = async () => {
    if (!guestId) return

    try {
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .select('id, entered_at, matched_at')
        .eq('user_id', guestId)
        .eq('is_guest', true)
        .is('matched_at', null)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

      if (data) {
        setIsInQueue(true)
        setMatchmakingId(data.id)
        startPolling()
      }
    } catch (error: any) {
      console.error('Queue status check error:', error)
    }
  }

  const joinQueue = async () => {
    if (!guestId || !sessionToken || !displayName) {
      toast({
        title: 'Missing information',
        description: 'Please create a guest session first',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      // Insert into matchmaking queue
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .insert({
          user_id: guestId,
          is_guest: true,
          display_name: displayName,
          tier: 'free',
          interests: [], // Could collect interests from user
          entered_at: new Date().toISOString(),
          last_ping_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setIsInQueue(true)
      setMatchmakingId(data.id)
      
      toast({
        title: 'Joined queue!',
        description: 'Looking for someone to chat with...',
        variant: 'success'
      })

      // Start polling for matches
      startPolling()

    } catch (error: any) {
      console.error('Join queue error:', error)
      toast({
        title: 'Failed to join queue',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const leaveQueue = async () => {
    if (!matchmakingId) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('id', matchmakingId)

      if (error) throw error

      setIsInQueue(false)
      setMatchmakingId(undefined)
      
      toast({
        title: 'Left queue',
        description: 'You have left the matchmaking queue',
        variant: 'default'
      })

    } catch (error: any) {
      console.error('Leave queue error:', error)
      toast({
        title: 'Error leaving queue',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startPolling = () => {
    // Poll every 3 seconds for matches
    const pollInterval = setInterval(async () => {
      if (!isInQueue || !matchmakingId) {
        clearInterval(pollInterval)
        return
      }

      try {
        // Update ping time to show user is still active
        await supabase
          .from('matchmaking_queue')
          .update({ last_ping_at: new Date().toISOString() })
          .eq('id', matchmakingId)

        // Check if matched
        const { data: queueData, error: queueError } = await supabase
          .from('matchmaking_queue')
          .select('matched_at')
          .eq('id', matchmakingId)
          .single()

        if (queueError) throw queueError

        if (queueData.matched_at) {
          clearInterval(pollInterval)
          handleMatchFound()
          return
        }

        // Get queue position estimate
        const { data: positionData, error: positionError } = await supabase.rpc('get_queue_position', {
          p_user_id: guestId,
          p_is_guest: true
        })

        if (!positionError && positionData) {
          setQueuePosition(positionData.queue_position || 0)
          setEstimatedWait(positionData.estimated_wait || 30)
        }

      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000)
  }

  const handleMatchFound = async () => {
    if (!matchmakingId || !guestId) return

    try {
      // Get match details
      const { data: matchData, error: matchError } = await supabase.rpc('match_users_v2', {
        p_user_id: guestId,
        p_is_guest: true,
        p_user_tier: 'free',
        p_user_interests: [],
        p_min_age: 18,
        p_max_age: 99
      })

      if (matchError) throw matchError

      if (matchData && matchData.length > 0 && matchData[0].match_user_id) {
        const match = matchData[0]
        
        // Create chat session
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: guestId,
            user2_id: match.match_user_id,
            user1_is_guest: true,
            user2_is_guest: match.match_is_guest,
            user1_display_name: displayName,
            user2_display_name: match.match_display_name,
            status: 'active',
            shared_interests: match.shared_interests || [],
            match_score: match.match_score,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (sessionError) throw sessionError

        // Mark both users as matched in queue
        await supabase
          .from('matchmaking_queue')
          .update({ matched_at: new Date().toISOString() })
          .eq('user_id', guestId)
          .eq('is_guest', true)
          .is('matched_at', null)

        if (match.match_user_id) {
          await supabase
            .from('matchmaking_queue')
            .update({ matched_at: new Date().toISOString() })
            .eq('user_id', match.match_user_id)
            .eq('is_guest', match.match_is_guest)
            .is('matched_at', null)
        }

        // Update guest session match count
        await supabase
          .from('guest_sessions')
          .update({ match_count: () => 'match_count + 1' })
          .eq('id', guestId)

        toast({
          title: 'Match found!',
          description: `Matched with ${match.match_display_name}`,
          variant: 'success'
        })

        // Callback with match data
        if (onMatchFound && sessionData) {
          onMatchFound({
            sessionId: sessionData.id,
            partnerId: match.match_user_id,
            partnerDisplayName: match.match_display_name,
            partnerIsGuest: match.match_is_guest
          })
        }

        setIsInQueue(false)
      }

    } catch (error: any) {
      console.error('Match handling error:', error)
      toast({
        title: 'Match error',
        description: error.message || 'Failed to create chat session',
        variant: 'destructive'
      })
    }
  }

  if (!guestId) {
    return (
      <Card className="p-6 text-center">
        <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-10 w-full mt-4 rounded-xl" />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {isInQueue ? 'Looking for someone...' : 'Ready to chat?'}
          </h3>
          <p className="text-gray-600">
            {isInQueue 
              ? `Position in queue: ${queuePosition} • ~${estimatedWait}s wait`
              : 'Find someone random to chat with'
            }
          </p>
        </div>

        {isInQueue && (
          <div className="space-y-4">
            <Progress value={Math.min(queuePosition * 10, 100)} className="h-2" />
            <p className="text-sm text-center text-gray-500">
              Matching you with someone compatible...
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={isInQueue ? leaveQueue : joinQueue}
            disabled={isLoading}
            variant={isInQueue ? 'outline' : 'default'}
            className={isInQueue 
              ? 'border-red-300 text-red-600 hover:bg-red-50' 
              : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
            }
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {isInQueue ? 'Leaving...' : 'Joining...'}
              </>
            ) : isInQueue ? (
              'Leave Queue'
            ) : (
              'Find Someone to Chat With'
            )}
          </Button>

          {isInQueue && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
              onClick={leaveQueue}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-medium text-gray-800">Fast</div>
              <div className="text-gray-500">30s average</div>
            </div>
            <div>
              <div className="font-medium text-gray-800">Safe</div>
              <div className="text-gray-500">Moderated</div>
            </div>
            <div>
              <div className="font-medium text-gray-800">Anonymous</div>
              <div className="text-gray-500">No signup</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}