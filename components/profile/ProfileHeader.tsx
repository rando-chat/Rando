'use client'

import { User, Crown, GraduationCap, Shield } from 'lucide-react'
import { TierDisplay } from './TierDisplay'
import type { User as DBUser } from '@/lib/supabase/client'

interface ProfileHeaderProps {
  user: DBUser
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const tierIcons = {
    free: <User className="w-5 h-5" />,
    student: <GraduationCap className="w-5 h-5" />,
    premium: <Crown className="w-5 h-5" />,
    admin: <Shield className="w-5 h-5" />,
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl p-8 shadow-xl">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="relative">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-24 h-24 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white bg-opacity-20 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Tier Badge */}
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2">
            {tierIcons[user.tier]}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{user.display_name}</h1>
            {user.email_verified && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Verified
              </span>
            )}
          </div>

          <TierDisplay tier={user.tier} />

          {user.bio && (
            <p className="mt-4 text-purple-100 max-w-2xl">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <div>
              <div className="text-2xl font-bold">{user.match_count}</div>
              <div className="text-sm text-purple-200">Matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.floor(parseInt(user.total_chat_time.split(':')[0]) / 60)}h
              </div>
              <div className="text-sm text-purple-200">Chat Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
