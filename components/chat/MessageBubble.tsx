/**
 * MessageBubble Component
 * 
 * Displays individual messages with safety indicators
 */

'use client'

import { formatRelativeTime } from '@/lib/utils'
import { Shield, AlertTriangle } from 'lucide-react'
import type { Message } from '@/lib/supabase/client'

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const isFlagged = !message.is_safe || message.flagged_reason !== null
  const moderationScore = message.moderation_score ?? 1.0

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isCurrentUser
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          } ${isFlagged ? 'border-2 border-yellow-400' : ''}`}
        >
          {/* Sender Name */}
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${isCurrentUser ? 'text-purple-100' : 'text-gray-600'}`}>
              {message.sender_display_name}
            </span>
            <span className={`text-xs ${isCurrentUser ? 'text-purple-200' : 'text-gray-500'}`}>
              {formatRelativeTime(message.created_at)}
            </span>
          </div>

          {/* Message Content */}
          <p className="break-words whitespace-pre-wrap">{message.content}</p>

          {/* Safety Indicators */}
          {isFlagged && (
            <div className={`mt-2 flex items-center gap-2 text-xs ${isCurrentUser ? 'text-purple-200' : 'text-yellow-600'}`}>
              <AlertTriangle className="w-3 h-3" />
              <span>Message flagged for review</span>
            </div>
          )}

          {message.edited && (
            <div className={`mt-1 text-xs ${isCurrentUser ? 'text-purple-200' : 'text-gray-500'}`}>
              (edited)
            </div>
          )}
        </div>

        {/* Moderation Score (for debugging - remove in production) */}
        {process.env.NODE_ENV === 'development' && moderationScore < 1.0 && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Safety: {(moderationScore * 100).toFixed(0)}%
          </div>
        )}

        {/* Delivery Status */}
        {isCurrentUser && (
          <div className="text-xs text-gray-500">
            {message.delivered ? (
              message.read_by_recipient ? 'Read' : 'Delivered'
            ) : 'Sending...'}
          </div>
        )}
      </div>
    </div>
  )
}
