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
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (msg: string) => {
    console.log(msg)
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  // Load partner name directly from database
  useEffect(() => {
    addDebug(`🔥 useEffect triggered`)
    addDebug(`📌 sessionId: ${sessionId}`)
    addDebug(`📌 guestId: ${guestId}`)

    if (!sessionId || !guestId) {
      addDebug(`⏳ Waiting for sessionId and guestId...`)
      return
    }

    const loadPartnerName = async () => {
      addDebug(`🔍 Loading partner name from database...`)
      setLoading(true)

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('user1_display_name, user2_display_name, user1_id, user2_id')
        .eq('id', sessionId)
        .single()

      if (error) {
        addDebug(`❌ Database error: ${error.message}`)
        setLoading(false)
        return
      }

      addDebug(`📊 Session data received`)
      addDebug(`  user1: ${session.user1_display_name} (${session.user1_id})`)
      addDebug(`  user2: ${session.user2_display_name} (${session.user2_id})`)

      if (session.user1_id === guestId) {
        setPartnerName(session.user2_display_name)
        addDebug(`✅ I am user1, partner is: ${session.user2_display_name}`)
      } else if (session.user2_id === guestId) {
        setPartnerName(session.user1_display_name)
        addDebug(`✅ I am user2, partner is: ${session.user1_display_name}`)
      } else {
        addDebug(`❌ User ID mismatch!`)
        addDebug(`  Session user1: ${session.user1_id}`)
        addDebug(`  Session user2: ${session.user2_id}`)
        addDebug(`  Current guest: ${guestId}`)
      }

      setLoading(false)
    }

    loadPartnerName()
  }, [sessionId, guestId])

  return (
    <>
      {/* Visual Debug Panel - ALWAYS VISIBLE AT TOP */}
      <div style={{
        background: '#1a1a2e',
        borderBottom: '2px solid #7c3aed',
        padding: '8px 16px',
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#0f0',
        maxHeight: '150px',
        overflowY: 'auto',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <strong style={{ color: '#7c3aed' }}>🐞 DEBUG LOG</strong>
          <button 
            onClick={() => setDebugInfo([])}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
        {debugInfo.length === 0 ? (
          <div style={{ color: '#666' }}>No logs yet...</div>
        ) : (
          debugInfo.slice(-5).map((log, i) => ( // Show last 5 logs
            <div key={i} style={{ marginBottom: '2px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
              {log}
            </div>
          ))
        )}
      </div>

      {/* Main Header */}
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
              {loading ? 'Connecting...' : (partnerLeft ? `${partnerName} left` : partnerName)}
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
    </>
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