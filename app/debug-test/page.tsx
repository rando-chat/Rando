'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function FullTestDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myDisplayName, setMyDisplayName] = useState<string>('')
  const [isInQueue, setIsInQueue] = useState(false)
  const [inChat, setInChat] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [deviceId, setDeviceId] = useState<string>('')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const messageSubscriptionRef = useRef<any>(null)

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${time}] ${message}`])
    console.log(`[${type.toUpperCase()}]`, message)
  }

  // Initialize connection and get fun name
  const initialize = async () => {
    addLog('🚀 Initializing connection...', 'info')
    
    try {
      // Test connection
      const { error } = await supabase.from('matchmaking_queue').select('count').limit(1)
      if (error) throw error
      addLog('✅ Connected to Supabase', 'success')

      // Create guest session with fun name
      const { data: guestSession, error: guestError } = await supabase
        .rpc('create_guest_session', {
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
          p_country_code: null
        })

      if (guestError) throw guestError

      if (guestSession && guestSession.length > 0) {
        const session = guestSession[0]
        setMyUserId(session.guest_id)
        setMyDisplayName(session.display_name)
        setDeviceId(session.guest_id.slice(0, 8))
        addLog(`✨ Got fun name: ${session.display_name}`, 'success')
        addLog(`🆔 Device ID: ${session.guest_id.slice(0, 8)}...`, 'info')
      }
    } catch (err: any) {
      addLog(`❌ Initialization failed: ${err.message}`, 'error')
    }
  }

  // Join matchmaking queue
  const joinQueue = async () => {
    if (!myUserId) {
      addLog('❌ Initialize first!', 'error')
      return
    }

    addLog('🎯 Joining matchmaking queue...', 'info')

    try {
      // Clear any existing queue entries
      await supabase.from('matchmaking_queue').delete().eq('user_id', myUserId)

      // Join queue
      const { error } = await supabase.from('matchmaking_queue').insert({
        user_id: myUserId,
        display_name: myDisplayName,
        is_guest: true,
        tier: 'free',
        interests: [],
        matched_at: null,
        entered_at: new Date().toISOString(),
      })

      if (error) throw error

      addLog(`✅ Joined queue as ${myDisplayName}`, 'success')
      setIsInQueue(true)

      // Start polling for matches
      pollingRef.current = setInterval(checkForMatch, 2000)
      setTimeout(checkForMatch, 500)

    } catch (err: any) {
      addLog(`❌ Failed to join queue: ${err.message}`, 'error')
    }
  }

  // Check for match
  const checkForMatch = async () => {
    if (!myUserId || !isInQueue) return

    try {
      // Check if we're already in a chat
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`)
        .eq('status', 'active')
        .maybeSingle()

      if (existingSession) {
        addLog(`✅ MATCH FOUND! Session ID: ${existingSession.id}`, 'success')
        
        const partnerName = existingSession.user1_id === myUserId 
          ? existingSession.user2_display_name 
          : existingSession.user1_display_name
        
        addLog(`👥 Partner: ${partnerName}`, 'success')
        
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
        setIsInQueue(false)
        setInChat(true)
        setCurrentSession(existingSession)
        
        // Subscribe to messages
        subscribeToMessages(existingSession.id)
        
        // Load existing messages
        loadMessages(existingSession.id)
        
        return
      }

      // Check queue position
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('display_name, user_id, entered_at')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      if (queue) {
        const myPosition = queue.findIndex(q => q.user_id === myUserId) + 1
        if (myPosition > 0) {
          addLog(`📊 Position in queue: ${myPosition}/${queue.length}`, 'info')
        }
      }

    } catch (err: any) {
      addLog(`❌ Polling error: ${err.message}`, 'error')
    }
  }

  // Load messages for a session
  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      data.forEach(msg => {
        const sender = msg.sender_id === myUserId ? 'You' : msg.sender_display_name
        addLog(`💬 ${sender}: ${msg.content}`, 'info')
      })
    }
  }

  // Subscribe to new messages
  const subscribeToMessages = (sessionId: string) => {
    messageSubscriptionRef.current = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const newMsg = payload.new
        setMessages(prev => [...prev, newMsg])
        
        const sender = newMsg.sender_id === myUserId ? 'You' : newMsg.sender_display_name
        addLog(`💬 ${sender}: ${newMsg.content}`, 'info')
        
        // Auto-scroll to bottom
        setTimeout(() => {
          const chatContainer = document.getElementById('chat-messages')
          if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight
        }, 100)
      })
      .subscribe()
  }

  // Send a message
  const sendMessage = async () => {
    if (!messageInput.trim() || !currentSession || !myUserId) return

    try {
      const { error } = await supabase.from('messages').insert({
        session_id: currentSession.id,
        sender_id: myUserId,
        sender_is_guest: true,
        sender_display_name: myDisplayName,
        content: messageInput,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setMessageInput('')
      addLog(`✉️ You sent: ${messageInput}`, 'success')

    } catch (err: any) {
      addLog(`❌ Failed to send: ${err.message}`, 'error')
    }
  }

  // Leave queue
  const leaveQueue = async () => {
    if (!myUserId) return

    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    await supabase.from('matchmaking_queue').delete().eq('user_id', myUserId)
    setIsInQueue(false)
    addLog('🚪 Left queue', 'warn')
  }

  // End chat
  const endChat = async () => {
    if (!currentSession) return

    if (messageSubscriptionRef.current) {
      supabase.removeChannel(messageSubscriptionRef.current)
    }

    await supabase
      .from('chat_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', currentSession.id)

    setInChat(false)
    setCurrentSession(null)
    setMessages([])
    addLog('👋 Chat ended', 'warn')
  }

  // Reset everything
  const reset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (messageSubscriptionRef.current) {
      supabase.removeChannel(messageSubscriptionRef.current)
    }
    
    setMyUserId(null)
    setMyDisplayName('')
    setIsInQueue(false)
    setInChat(false)
    setCurrentSession(null)
    setMessages([])
    setLogs([])
    
    addLog('🔄 Reset complete. Click Initialize to start.', 'info')
  }

  useEffect(() => {
    addLog('🎮 FULL APP TEST DEBUG PAGE', 'info')
    addLog('Open this page on TWO devices to test matching!', 'warn')
    addLog('1. Click Initialize on both devices', 'info')
    addLog('2. Click Join Queue on both devices', 'info')
    addLog('3. Watch them match automatically!', 'info')
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (messageSubscriptionRef.current) {
        supabase.removeChannel(messageSubscriptionRef.current)
      }
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', padding: 20, color: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 32, color: '#0ff', marginBottom: 10 }}>
            🎮 FULL APP TEST DEBUG
          </h1>
          <p style={{ color: '#ccc' }}>
            Open this page on TWO devices to test the complete flow
          </p>
        </div>

        {/* Device Info */}
        <div style={{ 
          background: '#16213e', 
          padding: 20, 
          borderRadius: 10,
          marginBottom: 20,
          border: '1px solid #0ff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#0ff' }}>Device ID:</strong>{' '}
              <span style={{ color: '#fff' }}>{deviceId || 'Not initialized'}</span>
            </div>
            <div>
              <strong style={{ color: '#0ff' }}>Name:</strong>{' '}
              <span style={{ color: '#ff0', fontWeight: 'bold' }}>{myDisplayName || 'Unknown'}</span>
            </div>
            <div>
              <strong style={{ color: '#0ff' }}>Status:</strong>{' '}
              <span style={{ 
                color: inChat ? '#0f0' : (isInQueue ? '#ff0' : '#f00'),
                fontWeight: 'bold'
              }}>
                {inChat ? 'IN CHAT' : (isInQueue ? 'IN QUEUE' : 'IDLE')}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {!myUserId && (
            <button onClick={initialize} style={buttonStyle.primary}>
              🚀 1. Initialize
            </button>
          )}
          
          {myUserId && !isInQueue && !inChat && (
            <button onClick={joinQueue} style={buttonStyle.success}>
              🎯 2. Join Queue
            </button>
          )}
          
          {isInQueue && (
            <button onClick={leaveQueue} style={buttonStyle.warning}>
              ⏏️ Leave Queue
            </button>
          )}
          
          {inChat && (
            <button onClick={endChat} style={buttonStyle.danger}>
              👋 End Chat
            </button>
          )}
          
          <button onClick={reset} style={buttonStyle.secondary}>
            🔄 Reset
          </button>
          
          <button onClick={() => setLogs([])} style={buttonStyle.secondary}>
            🧹 Clear Logs
          </button>
        </div>

        {/* Chat Area (shown when in chat) */}
        {inChat && currentSession && (
          <div style={{ 
            background: '#16213e', 
            padding: 20, 
            borderRadius: 10,
            marginBottom: 20,
            border: '1px solid #0f0'
          }}>
            <h3 style={{ color: '#0f0', marginBottom: 10 }}>
              💬 CHAT ACTIVE - Session: {currentSession.id.slice(0, 8)}...
            </h3>
            
            {/* Messages */}
            <div 
              id="chat-messages"
              style={{ 
                height: 200, 
                overflowY: 'auto', 
                background: '#1a1a2e', 
                padding: 10,
                borderRadius: 5,
                marginBottom: 10,
                fontFamily: 'monospace'
              }}
            >
              {messages.map((msg, i) => (
                <div key={i} style={{ 
                  marginBottom: 5,
                  color: msg.sender_id === myUserId ? '#0ff' : '#ff0'
                }}>
                  <strong>{msg.sender_id === myUserId ? 'You' : msg.sender_display_name}:</strong> {msg.content}
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: 10,
                  background: '#1a1a2e',
                  border: '1px solid #0ff',
                  borderRadius: 5,
                  color: '#fff'
                }}
              />
              <button onClick={sendMessage} style={buttonStyle.primary}>
                Send
              </button>
            </div>
          </div>
        )}

        {/* Queue Status */}
        <div style={{ 
          background: '#16213e', 
          padding: 20, 
          borderRadius: 10,
          marginBottom: 20
        }}>
          <h3 style={{ color: '#0ff', marginBottom: 10 }}>📊 QUEUE STATUS</h3>
          <button 
            onClick={async () => {
              const { data } = await supabase
                .from('matchmaking_queue')
                .select('display_name, user_id, entered_at')
                .is('matched_at', null)
                .order('entered_at', { ascending: true })
              
              if (data) {
                addLog(`📋 Queue has ${data.length} users:`, 'info')
                data.forEach((entry, i) => {
                  const isMe = entry.user_id === myUserId
                  addLog(`   ${i + 1}. ${entry.display_name} ${isMe ? '👤 YOU' : ''}`, 'info')
                })
              }
            }}
            style={buttonStyle.secondary}
          >
            🔍 Refresh Queue
          </button>
        </div>

        {/* Instructions */}
        <div style={{ 
          background: '#16213e', 
          padding: 20, 
          borderRadius: 10,
          marginBottom: 20
        }}>
          <h3 style={{ color: '#ff0', marginBottom: 10 }}>📋 TEST INSTRUCTIONS</h3>
          <ol style={{ color: '#ccc', lineHeight: 1.8 }}>
            <li>Open this page on <strong>TWO different devices</strong> (or two browser tabs)</li>
            <li>Click <strong style={{ color: '#0ff' }}>Initialize</strong> on both devices</li>
            <li>Click <strong style={{ color: '#0ff' }}>Join Queue</strong> on both devices</li>
            <li>Watch the logs - they should match within 2-10 seconds</li>
            <li>Once matched, send messages between devices!</li>
            <li>Each message appears in real-time on both devices</li>
          </ol>
        </div>

        {/* Logs */}
        <div style={{ 
          background: '#0a0a1a', 
          padding: 20, 
          borderRadius: 10,
          border: '1px solid #0ff'
        }}>
          <h3 style={{ color: '#0ff', marginBottom: 10 }}>📝 LIVE LOGS</h3>
          <div style={{ 
            height: 300, 
            overflowY: 'auto', 
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#0f0'
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: 2 }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const buttonStyle = {
  primary: {
    padding: '10px 20px',
    background: '#0ff',
    color: '#000',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  success: {
    padding: '10px 20px',
    background: '#0f0',
    color: '#000',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  warning: {
    padding: '10px 20px',
    background: '#ff0',
    color: '#000',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  danger: {
    padding: '10px 20px',
    background: '#f00',
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  secondary: {
    padding: '10px 20px',
    background: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer'
  }
}