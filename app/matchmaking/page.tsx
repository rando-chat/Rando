'use client'

import { MatchmakingQueue } from '@/components/matchmaking/MatchmakingQueue'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function MatchmakingPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <MatchmakingQueue />
        </div>
      </div>
    </AuthGuard>
  )
}
