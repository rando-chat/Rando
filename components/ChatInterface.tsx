// components/ChatInterface.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/database/client'
import { useToast } from '@/components/ui/toast'

interface Message {
  id: string
  content: string
  sender_display_name: string
  sender_id: string
  sender_is_guest: boolean
  is_safe: boolean
  moderation_score: number
  flagged_reason?: string
  created_at: string
}

interface ChatInterfaceProps {
  sessionId: string
  userId: string
  userIsGuest: boolean
  displayName: string
  onSessionEnd?: () => void
}

export default function ChatInterface({
  sessionId,
  userId,
  userIsGuest,
  displayName,
  onSessionEnd
}: ChatInterfaceProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sessionDetails, setSessionDetails] = useState<any>(null)

  // Fetch session details and messages
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails()
      fetchMessages()
      setupRealtimeSubscription()
    }
  }, [sessionId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchSessionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      setSessionDetails(data)
    } catch (error: any) {
      console.error('Session details error:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (error: any) {
      toast({
        title: 'Failed to load messages',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new.status === 'ended') {
            toast({
              title: 'Chat ended',
              description: 'The other user has left the chat',
              variant: 'default'
            })
            onSessionEnd?.()
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async () => {
    const content = newMessage.trim()
    if (!content || isSending) return

    // Basic validation
    if (content.length > 2000) {
      toast({
        title: 'Message too long',
        description: 'Maximum 2000 characters',
        variant: 'destructive'
      })
      return
    }

    if (content.length < 1) {
      toast({
        title: 'Message empty',
        description: 'Please type a message',
        variant: 'destructive'
      })
      return
    }

    setIsSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          sender_id: userId,
          sender_is_guest: userIsGuest,
          sender_display_name: displayName,
          content: content,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setNewMessage('')
      
    } catch (error: any) {
      console.error('Send message error:', error)
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  const endSession = async () => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          ended_by: userId,
          end_reason: 'User ended chat'
        })
        .eq('id', sessionId)

      if (error) throw error

      toast({
        title: 'Chat ended',
        description: 'You have left the conversation',
        variant: 'success'
      })

      onSessionEnd?.()
    } catch (error: any) {
      console.error('End session error:', error)
      toast({
        title: 'Failed to end chat',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    }
  }

  const reportUser = async () => {
    if (!sessionDetails) return

    const reportedUserId = sessionDetails.user1_id === userId ? sessionDetails.user2_id : sessionDetails.user1_id
    const reportedUserIsGuest = sessionDetails.user1_id === userId ? sessionDetails.user2_is_guest : sessionDetails.user1_is_guest

    try {
      const { error } = await supabase.rpc('handle_user_report', {
        p_reporter_id: userId,
        p_reporter_is_guest: userIsGuest,
        p_reported_user_id: reportedUserId,
        p_reported_user_is_guest: reportedUserIsGuest,
        p_session_id: sessionId,
        p_reason: 'Inappropriate behavior in chat',
        p_category: 'inappropriate_content',
        p_evidence: { session_id: sessionId }
      })

      if (error) throw error

      toast({
        title: 'Report submitted',
        description: 'Thank you for reporting. Our moderators will review.',
        variant: 'success'
      })

      // End session after reporting
      endSession()
    } catch (error: any) {
      console.error('Report error:', error)
      toast({
        title: 'Report failed',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const isOwnMessage = (message: Message) => {
    return message.sender_id === userId && message.sender_is_guest === userIsGuest
  }

  const getPartnerName = () => {
    if (!sessionDetails) return '...'
    
    if (sessionDetails.user1_id === userId) {
      return sessionDetails.user2_display_name
    } else {
      return sessionDetails.user1_display_name
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <div>
            <h3 className="font-semibold text-gray-800">
              Chat with {getPartnerName()}
            </h3>
            <p className="text-sm text-gray-500">
              {isConnected ? 'Connected • Secure' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reportUser}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={endSession}
            className="border-gray-300 hover:bg-gray-50"
          >
            End Chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="mb-2 font-medium">No messages yet</p>
              <p className="text-sm">Say hello to start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  isOwnMessage(message)
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {message.sender_display_name}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                {!message.is_safe && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      Flagged
                    </Badge>
                    {message.flagged_reason && (
                      <span className="text-xs text-red-600">{message.flagged_reason}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex space-x-3"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending || !isConnected}
            maxLength={2000}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending || !isConnected}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </form>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>
            Press Enter to send • {newMessage.length}/2000 • Safety: {isConnected ? '🟢 Active' : '🔴 Offline'}
          </span>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </Card>
  )
}