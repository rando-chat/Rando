'use client'
import { useEffect } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { QueueStatus } from './QueueStatus'
import { MatchFound } from './MatchFound'
import { Preferences } from './Preferences'
import { useAuth } from '@/components/auth/AuthProvider'

export function MatchmakingQueue() {
  const { getUserId, isGuest, getDisplayName, getUserTier } = useAuth()
  const {
    isInQueue,
    queuePosition,
    estimatedWait,
    matchFound,
    joinQueue,
    leaveQueue,
    isLoading,
  } = useMatchmaking()

  if (matchFound) {
    return <MatchFound match={matchFound} />
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Find a Match</h1>
        
        {!isInQueue ? (
          <>
            <Preferences />
            <button
              onClick={() => joinQueue({
                userId: getUserId()!,
                isGuest,
                displayName: getDisplayName(),
                tier: getUserTier() as any,
                interests: [],
              })}
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join Queue'}
            </button>
          </>
        ) : (
          <QueueStatus
            position={queuePosition}
            estimatedWait={estimatedWait}
            onLeave={leaveQueue}
          />
        )}
      </div>
    </div>
  )
}
