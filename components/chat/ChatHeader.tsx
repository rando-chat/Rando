'use client'

import { User, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { ChatActions } from './ChatActions'
import type { ChatSession } from '@/lib/supabase/client'

interface ChatHeaderProps {
  session: ChatSession
  partnerName: string
  onEndChat: () => Promise<void>
}

export function ChatHeader({ session, partnerName, onEndChat }: ChatHeaderProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="bg-white border-b px-4 py-3 flex justify-between items-center relative">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{partnerName}</h3>
          {session.shared_interests && session.shared_interests.length > 0 && (
            <p className="text-xs text-gray-500">
              Shared: {session.shared_interests.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>
      
      <button
        onClick={() => setShowActions(!showActions)}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {showActions && (
        <ChatActions
          sessionId={session.id}
          onClose={() => setShowActions(false)}
          onEndChat={onEndChat}
        />
      )}
    </div>
  )
}
