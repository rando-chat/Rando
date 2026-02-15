'use client'

import { use } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const { messages, isLoading } = useMessages(id)

  return (
    <AuthGuard requireUser>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-2xl font-bold mb-6">Chat History</h1>

          {isLoading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="bg-white rounded-lg p-4 space-y-4">
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  senderName={msg.sender_display_name}
                  isMe={msg.sender_id === user?.id}
                  timestamp={msg.created_at}
                  status={msg.read_by_recipient ? 'read' : 'delivered'}
                  // reactions={msg.reactions || {}}  // ❌ REMOVE THIS LINE
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}