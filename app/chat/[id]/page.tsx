'use client'

import { ChatInterface } from '@/components/chat/ChatInterface'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { use } from 'react'

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  return (
    <AuthGuard>
      <ChatInterface sessionId={id} />
    </AuthGuard>
  )
}
