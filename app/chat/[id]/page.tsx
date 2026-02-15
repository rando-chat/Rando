'use client'

import ChatInterface from '@/components/chat/ChatInterface'  // Remove the {}

export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatInterface sessionId={params.id} />
}