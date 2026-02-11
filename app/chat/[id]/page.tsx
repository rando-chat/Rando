'use client'

import { ChatInterface } from '@/components/chat/ChatInterface'
import { use } from 'react'

// No AuthGuard - guests can chat
export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <ChatInterface sessionId={id} />
}