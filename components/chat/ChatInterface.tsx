// components/chat/ChatInterface.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/database/client'
import { useUser } from '@/app/providers'
import { useToast } from '@/components/ui/toast'
import type { ChatMessage } from '@/lib/types/database.types'

interface ChatInterfaceProps {
  sessionId: string
  otherUserName: string
  sharedInterests: string[]
}

export function ChatInterface({ sessionId, otherUserName, sharedInterests }: ChatInterfaceProps) {
  const { user, guestSession } = useUser()
  const { toast } = useToast()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>()
  const [showSafetyWarning, setShowSafetyWarning] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<any>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch existing messages
  useEffect(() => {
    fetchMessages()
    setupRealtimeSubscription()
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [sessionId])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    // Subscribe to new messages
    channelRef.current = supabase
      .channel(`messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages(prev => [...prev, newMsg])
          
          // Play notification sound if message is from other user
          if (newMsg.sender_id !== (user?.id || guestSession?.guest_id)) {
            playNotificationSound()
          }
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
          const updatedSession = payload.new as any
          if (updatedSession.status !== 'active') {
            toast({
              title: 'Chat ended',
              description: 'The other user has left the chat',
              variant: 'info'
            })
          }
        }
      )
      .subscribe()
  }

  const playNotificationSound = () => {
    // Create a simple notification sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch {
      // Audio context not supported, silently fail
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleTyping = () => {
    setIsTyping(true)
    
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    const timeout = setTimeout(() => {
      setIsTyping(false)
    }, 3000)
    
    setTypingTimeout(timeout)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setIsSending(true)
    setShowSafetyWarning(false)

    try {
      // Pre-check message safety
      const { data: safetyCheck, error: safetyError } = await supabase.rpc(
        'check_content_advanced',
        {
          p_content: messageContent,
          p_user_id: user?.id || null,
          p_is_guest: !!guestSession
        }
      )

      if (safetyError) throw safetyError

      if (safetyCheck && safetyCheck[0] && !safetyCheck[0].is_safe) {
        setShowSafetyWarning(true)
        toast({
          title: 'Message blocked',
          description: safetyCheck[0].flagged_reasons.join(', '),
          variant: 'destructive'
        })
        return
      }

      // Get current user info
      const userId = user?.id || guestSession?.guest_id
      const isGuest = !!guestSession
      let displayName = 'User'

      if (isGuest && guestSession) {
        displayName = guestSession.display_name
      } else if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', userId)
          .single()
        if (userData) displayName = userData.display_name
      }

      // Insert message (trigger will handle safety check)
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          sender_id: userId,
          sender_is_guest: isGuest,
          sender_display_name: displayName,
          content: messageContent
        })

      if (insertError) throw insertError

      // Clear input and refocus
      inputRef.current?.focus()

    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      })
      // Restore message if failed
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const handleReportUser = async () => {
    try {
      const userId = user?.id || guestSession?.guest_id
      const isGuest = !!guestSession
      
      const { data, error } = await supabase.rpc('handle_user_report', {
        p_reporter_id: userId,
        p_reporter_is_guest: isGuest,
        p_reported_user_id: messages.find(m => m.sender_id !== userId)?.sender_id || '',
        p_reported_user_is_guest: messages.find(m => m.sender_id !== userId)?.sender_is_guest || false,
        p_session_id: sessionId,
        p_reason: 'Inappropriate behavior in chat',
        p_category: 'inappropriate_content',
        p_evidence: JSON.stringify({ session_id: sessionId })
      })

      if (error) throw error

      if (data && data[0]) {
        const result = data[0]
        if (result.success) {
          toast({
            title: 'Report submitted',
            description: result.message,
            variant: 'success'
          })
        } else {
          toast({
            title: 'Cannot report',
            description: result.message,
            variant: 'destructive'
          })
        }
      }
    } catch (error: any) {
      console.error('Error reporting user:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        variant: 'destructive'
      })
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return (
      <Card className="p-6 h-full">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-16 w-2/3 rounded-2xl" />
              </div>
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px] border-2 border-purple-100 shadow-xl">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-semibold">{otherUserName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{otherUserName}</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-500">
                  {isTyping ? 'typing...' : 'online'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {sharedInterests.length > 0 && (
              <div className="hidden md:flex items-center gap-1">
                {sharedInterests.slice(0, 2).map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {sharedInterests.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{sharedInterests.length - 2}
                  </Badge>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReportUser}
              className="text-gray-500 hover:text-coral-600 hover:bg-coral-50"
            >
              Report
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center">
              <span className="text-4xl">💬</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-2">
              Start the conversation!
            </h4>
            <p className="text-gray-600 mb-4 max-w-md">
              Say hello to {otherUserName}. You share {sharedInterests.length} interest{sharedInterests.length !== 1 ? 's' : ''} in common.
            </p>
            <p className="text-sm text-gray-500">
              Be respectful and follow community guidelines
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === (user?.id || guestSession?.guest_id)
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-3 ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className="text-xs font-medium mb-1 text-purple-600">
                        {message.sender_display_name}
                      </div>
                    )}
                    
                    {!message.is_safe ? (
                      <div className="italic text-sm opacity-80">
                        ❌ Message blocked: {message.flagged_reason}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    )}
                    
                    <div
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                      {message.read_by_recipient && isOwnMessage && (
                        <span className="ml-1">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Safety Warning */}
      {showSafetyWarning && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <div className="flex items-center justify-between">
            <span>Your last message was blocked for safety reasons.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSafetyWarning(false)}
              className="text-white hover:text-white hover:bg-red-600"
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
            placeholder={`Message ${otherUserName}...`}
            disabled={isSending}
            className="flex-1"
            maxLength={2000}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-coral-500 to-pink-500 hover:from-coral-600 hover:to-pink-600"
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send'
            )}
          </Button>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">
            Press Enter to send • Shift+Enter for new line
          </span>
          <span className="text-xs text-gray-500">
            {newMessage.length}/2000
          </span>
        </div>
      </form>
    </Card>
  )
}