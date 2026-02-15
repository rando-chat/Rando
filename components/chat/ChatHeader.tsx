'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ChatHeaderProps {
  sessionId: string
  guestId?: string
  isOnline: boolean
  isTyping: boolean
  partnerLeft: boolean
  onOpenSidebar: () => void
  onReport: () => void
  onEndChat: () => void
}

export function ChatHeader({
  sessionId,
  guestId,
  isOnline,
  isTyping,
  partnerLeft,
  onOpenSidebar,
  onReport,
  onEndChat
}: ChatHeaderProps) {
  const [partnerName, setPartnerName] = useState('')
  const [loading, setLoading] = useState(true)

  // Load partner name directly from database
  useEffect(() => {
    if (!sessionId || !guestId) return

    const loadPartnerName = async () => {
      setLoading(true)
      console.log('🔍 Loading partner name for session:', sessionId)
      console.log('🔍 Current guest ID:', guestId)

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('user1_display_name, user2_display_name, user1_id, user2_id')
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('Error loading session:', error)
        setLoading(false)
        return
      }

      console.log('📊 Session data:', session)

      // Determine partner name based on current user
      if (session.user1_id === guestId) {
        // Current user is user1, partner is user2
        setPartnerName(session.user2_display_name)
        console.log('✅ I am user1, partner is:', session.user2_display_name)
      } else if (session.user2_id === guestId) {
        // Current user is user2, partner is user1
        setPartnerName(session.user1_display_name)
        console.log('✅ I am user2, partner is:', session.user1_display_name)
      } else {
        console.error('❌ Current user not found in session!')
        console.log('Session user1_id:', session.user1_id)
        console.log('Session user2_id:', session.user2_id)
        console.log('Current guestId:', guestId)
      }

      setLoading(false)
    }

    loadPartnerName()
  }, [sessionId, guestId])

  if (loading) {
    return (
      <div style={{
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(124,58,237,0.2)',
        padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ color: '#60607a' }}>Loading chat...</div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(10,10,15,0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(124,58,237,0.2)',
      padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 20,
      position: 'relative',
    }}>
      {/* Left section - Partner info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 'clamp(36px, 8vw, 44px)',
            height: 'clamp(36px, 8vw, 44px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 'clamp(16px, 4vw, 20px)',
          }}>
            {partnerName?.[0]?.toUpperCase() || '?'}
          </div>
          {isOnline && !partnerLeft && (
            <div style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 'clamp(8px, 2vw, 10px)',
              height: 'clamp(8px, 2vw, 10px)',
              background: '#22c55e',
              borderRadius: '50%',
              border: '2px solid #0a0a0f',
              animation: 'pulse 2s infinite',
            }} />
          )}
        </div>

        <div>
          <h2 style={{
            fontSize: 'clamp(16px, 4vw, 18px)',
            fontWeight: 600,
            color: '#f0f0f0',
            marginBottom: 2,
            fontFamily: "'Georgia', serif",
          }}>
            {partnerLeft ? `${partnerName} left` : partnerName}
          </h2>
          <p style={{
            fontSize: 'clamp(11px, 2.8vw, 12px)',
            color: isTyping ? '#7c3aed' : '#60607a',
            fontStyle: isTyping ? 'normal' : 'italic',
          }}>
            {partnerLeft ? 'Chat ended' : isTyping ? 'typing...' : 'Online'}
          </p>
        </div>
      </div>

      {/* Right section - Actions */}
      <div style={{ display: 'flex', gap: 'clamp(4px, 2vw, 8px)' }}>
        <button
          onClick={onOpenSidebar}
          style={iconButtonStyle}
          title="Chat info"
        >
          ℹ️
        </button>
        <button
          onClick={onReport}
          style={iconButtonStyle}
          title="Report user"
        >
          ⚠️
        </button>
        <button
          onClick={onEndChat}
          style={{...iconButtonStyle, color: '#ef4444'}}
          title="End chat"
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

const iconButtonStyle = {
  background: 'transparent',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '8px',
  width: 'clamp(36px, 8vw, 40px)',
  height: 'clamp(36px, 8vw, 40px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 'clamp(16px, 4vw, 18px)',
  color: '#a0a0b0',
  transition: 'all 0.2s ease',
}