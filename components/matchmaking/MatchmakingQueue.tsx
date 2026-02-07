// components/matchmaking/MatchmakingQueue.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface MatchmakingQueueProps {
  queueId: string | null
  estimatedWaitTime: number
  onLeaveQueue: () => void
}

export function MatchmakingQueue({ 
  queueId, 
  estimatedWaitTime, 
  onLeaveQueue 
}: MatchmakingQueueProps) {
  const [timeInQueue, setTimeInQueue] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInQueue(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Calculate progress based on time in queue vs estimated wait
    const calculatedProgress = Math.min((timeInQueue / estimatedWaitTime) * 100, 95)
    setProgress(calculatedProgress)
  }, [timeInQueue, estimatedWaitTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!queueId) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-1/2 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">⏳</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Finding a Match
        </h3>
        <p className="text-gray-600">
          We're searching for someone compatible
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Time in queue:</span>
            <span className="font-medium">{formatTime(timeInQueue)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">
              {Math.max(1, Math.floor(estimatedWaitTime / 10))}
            </div>
            <div className="text-xs text-gray-600">People ahead</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">
              {estimatedWaitTime}s
            </div>
            <div className="text-xs text-gray-600">Est. wait time</div>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Active search</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Badge variant="outline" className="mr-2">✓</Badge>
              <span className="text-gray-700">Checking compatibility</span>
            </div>
            <div className="flex items-center text-sm">
              <Badge variant="outline" className="mr-2">✓</Badge>
              <span className="text-gray-700">Filtering by interests</span>
            </div>
            <div className="flex items-center text-sm">
              <Badge variant="outline" className="mr-2 animate-pulse">●</Badge>
              <span className="text-gray-700">Finding best match</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onLeaveQueue}
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Leave Queue
        </Button>
        <p className="text-xs text-gray-500 text-center mt-3">
          You can leave anytime and rejoin later
        </p>
      </div>
    </div>
  )
}