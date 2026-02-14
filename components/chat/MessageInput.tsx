'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, AlertCircle } from 'lucide-react'
import { checkContentSafety } from '@/lib/database/queries'
import { useAuth } from '@/components/auth/AuthProvider'
import { debounce } from '@/lib/utils'
import type { SessionStatus } from '@/lib/database.types'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  onTypingStart: () => void
  onTypingStop: () => void
  disabled?: boolean
  sessionStatus: SessionStatus
}

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  sessionStatus,
}: MessageInputProps) {
  const { getUserId, isGuest } = useAuth()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const MAX_LENGTH = 2000

  const debouncedStopTyping = useRef(
    debounce(() => {
      setIsTyping(false)
      onTypingStop()
    }, 1000)
  ).current

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value

    if (newMessage.length > MAX_LENGTH) {
      return
    }

    setMessage(newMessage)

    if (!isTyping && newMessage.length > 0) {
      setIsTyping(true)
      onTypingStart()
    }

    if (newMessage.length > 0) {
      debouncedStopTyping()
    } else {
      setIsTyping(false)
      onTypingStop()
    }

    if (safetyWarning) {
      setSafetyWarning(null)
    }

    if (newMessage.length > 10) {
      checkSafetyDebounced(newMessage)
    }
  }

  const checkSafetyDebounced = useRef(
    debounce(async (content: string) => {
      try {
        const userId = getUserId()
        if (!userId) return

        const result = await checkContentSafety(content, userId, isGuest)

        if (result && !result.is_safe) {
          if (result.safety_score < 0.3) {
            setSafetyWarning('⚠️ This message may not be allowed')
          } else if (result.safety_score < 0.6) {
            setSafetyWarning('⚠️ This message may be flagged')
          }
        } else {
          setSafetyWarning(null)
        }
      } catch (error) {
        console.error('Safety check failed:', error)
      }
    }, 500)
  ).current

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage || isSending || disabled) return

    setIsSending(true)
    setIsTyping(false)
    onTypingStop()

    try {
      await onSend(trimmedMessage)
      setMessage('')
      setSafetyWarning(null)
      textareaRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const isDisabled = disabled || isSending || sessionStatus !== 'active'

  return (
    <div className="border-t bg-white p-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        {safetyWarning && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>{safetyWarning}</span>
          </div>
        )}

        {sessionStatus !== 'active' && (
          <div className="text-sm text-gray-500 text-center">
            {sessionStatus === 'ended' && 'Chat has ended'}
            {sessionStatus === 'reported' && 'Chat under review'}
            {sessionStatus === 'banned' && 'Chat has been banned'}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isDisabled ? 'Chat is not active' : 'Type your message...'}
            disabled={isDisabled}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32"
            rows={1}
            maxLength={MAX_LENGTH}
          />

          <button
            type="submit"
            disabled={isDisabled || !message.trim()}
            className="px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {message.length > 0 && `${message.length}/${MAX_LENGTH}`}
          </span>
          <span className="text-gray-400">
            Press Enter to send • Shift+Enter for new line
          </span>
        </div>
      </form>
    </div>
  )
}