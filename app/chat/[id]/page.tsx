'use client'

import { ChatContainer } from '@/components/chat/ChatContainer'

export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatContainer sessionId={params.id} />
}