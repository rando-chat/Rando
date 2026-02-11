'use client'

import { use } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { getUserId } = useAuth()
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
                  message={msg}
                  isCurrentUser={msg.sender_id === getUserId()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
