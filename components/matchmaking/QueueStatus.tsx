'use client'
import { Users, Clock } from 'lucide-react'

interface QueueStatusProps {
  position: number
  estimatedWait: number
  onLeave: () => void
}

export function QueueStatus({ position, estimatedWait, onLeave }: QueueStatusProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
          <Users className="w-10 h-10 text-purple-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Finding your match...</h2>
        <p className="text-gray-600">Stay on this page while we search</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600">{position}</div>
          <div className="text-sm text-gray-600">Queue Position</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600">{estimatedWait}s</div>
          <div className="text-sm text-gray-600">Est. Wait</div>
        </div>
      </div>

      <button
        onClick={onLeave}
        className="w-full py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Leave Queue
      </button>
    </div>
  )
}
