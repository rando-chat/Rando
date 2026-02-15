'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface DebugLoggerProps {
  sessionId: string
  guestSession: any
  messages: any[]
  partnerName: string
  myName: string
}

export function DebugLogger({ sessionId, guestSession, messages, partnerName, myName }: DebugLoggerProps) {
  const [logs, setLogs] = useState<string[]>([])

  // Auto-log important events
  useEffect(() => {
    addLog(`📱 Session ID: ${sessionId}`)
    addLog(`👤 My guest ID: ${guestSession?.guest_id}`)
    addLog(`📛 My name: ${myName}`)
    addLog(`👥 Partner name: ${partnerName}`)
  }, [sessionId, guestSession, myName, partnerName])

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      addLog(`💬 New message from ${lastMsg.sender_display_name}: ${lastMsg.content.substring(0, 30)}...`)
    }
  }, [messages])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const checkChannel = async () => {
    addLog('🔍 Checking Supabase connection...')
    try {
      const { error } = await supabase.from('messages').select('count').limit(1)
      if (error) throw error
      addLog('✅ Connection OK')
    } catch (err: any) {
      addLog(`❌ Connection failed: ${err.message}`)
    }
  }

  const checkSession = () => {
    addLog(`📊 Session data:`)
    addLog(`  - sessionId: ${sessionId}`)
    addLog(`  - guestId: ${guestSession?.guest_id}`)
    addLog(`  - myName: ${myName}`)
    addLog(`  - partnerName: ${partnerName}`)
    addLog(`  - messages count: ${messages.length}`)
  }

  const checkLastMessage = () => {
    if (messages.length === 0) {
      addLog('📭 No messages yet')
      return
    }
    const lastMsg = messages[messages.length - 1]
    addLog(`📨 Last message:`)
    addLog(`  - id: ${lastMsg.id}`)
    addLog(`  - from: ${lastMsg.sender_display_name}`)
    addLog(`  - content: ${lastMsg.content}`)
    addLog(`  - time: ${new Date(lastMsg.created_at).toLocaleTimeString()}`)
    
    if (lastMsg.content.startsWith('📷 Image:')) {
      addLog(`  - 📷 IMAGE DETECTED`)
      const url = lastMsg.content.replace('📷 Image: ', '')
      addLog(`  - url: ${url}`)
    }
  }

  // ALWAYS VISIBLE - no toggle
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '500px',
      background: '#0a0a0f',
      border: '2px solid #7c3aed',
      borderRadius: '12px',
      padding: '16px',
      zIndex: 99999, // Super high z-index
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      pointerEvents: 'auto', // Ensure it's clickable
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid #333',
        paddingBottom: '8px'
      }}>
        <h3 style={{ color: '#7c3aed', margin: 0 }}>🐞 DEBUG LOGGER</h3>
        <div>
          <button
            onClick={() => setLogs([])}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={checkChannel} style={debugButtonStyle}>Test Connection</button>
        <button onClick={checkSession} style={debugButtonStyle}>Check Session</button>
        <button onClick={checkLastMessage} style={debugButtonStyle}>Last Message</button>
      </div>

      <div style={{
        background: '#000',
        color: '#0f0',
        padding: '10px',
        borderRadius: '8px',
        height: '300px',
        overflowY: 'auto',
        fontSize: '11px',
        fontFamily: 'monospace'
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #222', paddingBottom: '4px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}

const debugButtonStyle = {
  background: '#1a1a2e',
  border: '1px solid #7c3aed',
  borderRadius: '4px',
  color: '#fff',
  cursor: 'pointer',
  padding: '6px 12px',
  fontSize: '12px'
}