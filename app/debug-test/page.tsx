'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SimpleDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [session, setSession] = useState<any>(null)
  const [inQueue, setInQueue] = useState(false)
  const [inChat, setInChat] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const testConnection = async () => {
    try {
      addLog('🔍 Testing Supabase connection...')
      const { error } = await supabase.from('matchmaking_queue').select('count').limit(1)
      if (error) throw error
      addLog('✅ Connection OK')
    } catch (err: any) {
      addLog(`❌ Connection failed: ${err.message}`)
    }
  }

  const testGuestSession = async () => {
    try {
      addLog('🎨 Creating guest session...')
      const { data, error } = await supabase.rpc('create_guest_session')
      if (error) throw error
      
      if (data && data.length > 0) {
        const guestSession = data[0]
        setSession(guestSession)
        addLog(`✅ Got fun name: ${guestSession.display_name}`)
      }
    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`)
    }
  }

  const testQueue = async () => {
    try {
      if (!session) {
        addLog('❌ Create guest session first')
        return
      }

      addLog('🎯 Joining queue...')
      
      // Clean up any old entries
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)

      const { error } = await supabase.from('matchmaking_queue').insert({
        user_id: session.guest_id,
        display_name: session.display_name,
        is_guest: true,
        tier: 'free',
        interests: [],
        entered_at: new Date().toISOString()
      })

      if (error) throw error
      addLog('✅ Joined queue')
      setInQueue(true)

      // Start aggressive checking
      startMatchChecking()

    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`)
    }
  }

  const startMatchChecking = () => {
    addLog('⏱️ Starting AGGRESSIVE polling (1 second interval)...')
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    // Immediate first check
    setTimeout(checkForMatch, 100)
    // Then every 1 second
    pollingRef.current = setInterval(checkForMatch, 1000)
  }

  const forceCheck = async () => {
    addLog('🔍 FORCE CHECKING NOW...')
    await checkForMatch()
  }

  const checkForMatch = async () => {
    if (!session) {
      addLog('❌ No session - polling stopped')
      return
    }

    try {
      addLog('🔍 Polling... checking for match')
      
      // CRITICAL: ALWAYS check for existing sessions FIRST
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${session.guest_id},user2_id.eq.${session.guest_id}`)
        .eq('status', 'active')
        .maybeSingle()

      // If found, IMMEDIATELY switch to chat mode
      if (existingSession) {
        addLog(`✅ MATCH FOUND! Session: ${existingSession.id.slice(0, 8)}...`)
        
        // Kill all polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        
        // Switch to chat mode
        setInQueue(false)
        setInChat(true)
        setCurrentSession(existingSession)
        loadMessages(existingSession.id)
        subscribeToMessages(existingSession.id)
        return
      }

      // Only check queue if we're supposed to be in it
      if (!inQueue) {
        addLog('⏸️ Not in queue - skipping check')
        return
      }

      // Get ALL queue entries
      const { data: queue, error } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      if (error) {
        addLog(`❌ Queue error: ${error.message}`)
        return
      }

      // Log full queue
      if (queue && queue.length > 0) {
        addLog(`📊 QUEUE (${queue.length} users):`)
        queue.forEach((entry, i) => {
          const isMe = entry.user_id === session.guest_id
          addLog(`   ${i+1}. ${entry.display_name} ${isMe ? '👤 YOU' : ''} - ${new Date(entry.entered_at).toLocaleTimeString()}`)
        })
      } else {
        addLog('📭 Queue is empty')
        return
      }

      // Find partner (not yourself)
      const partner = queue.find(u => u.user_id !== session.guest_id)

      if (!partner) {
        addLog('⏳ No other users in queue')
        return
      }

      addLog(`🎯 Found partner: ${partner.display_name}`)
      
      const shouldCreate = session.guest_id < partner.user_id
      addLog(`🎲 ${shouldCreate ? 'I CREATE session' : 'WAITING for partner to create'}`)

      if (shouldCreate) {
        await createChatSession(partner)
      }

    } catch (err: any) {
      addLog(`❌ Check error: ${err.message}`)
    }
  }

  const createChatSession = async (partner: any) => {
    try {
      addLog('🔨 Creating chat session...')
      
      const { error: updateError } = await supabase
        .from('matchmaking_queue')
        .update({ matched_at: new Date().toISOString() })
        .in('user_id', [session.guest_id, partner.user_id])

      if (updateError) throw updateError

      const { data: newSession, error: insertError } = await supabase
        .from('chat_sessions')
        .insert({
          user1_id: session.guest_id,
          user2_id: partner.user_id,
          user1_display_name: session.display_name,
          user2_display_name: partner.display_name,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError

      addLog(`✅ Session created! ID: ${newSession.id.slice(0, 8)}...`)
      
      // Remove from queue
      await supabase.from('matchmaking_queue').delete().in('user_id', [session.guest_id, partner.user_id])

      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      setInQueue(false)
      setInChat(true)
      setCurrentSession(newSession)
      loadMessages(newSession.id)
      subscribeToMessages(newSession.id)

    } catch (err: any) {
      addLog(`❌ Session creation failed: ${err.message}`)
    }
  }

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      data.forEach(msg => {
        addLog(`💬 ${msg.sender_display_name}: ${msg.content}`)
      })
    }
  }

  const subscribeToMessages = (sessionId: string) => {
    addLog(`📡 Setting up message subscription for session: ${sessionId.slice(0, 8)}...`)
    
    // Clean up any existing channel
    if (channelRef.current) {
      addLog('🧹 Removing old channel')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Remove all channels to be safe
    supabase.removeAllChannels()
    
    const channel = supabase.channel(`chat-${sessionId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: session.guest_id }
      }
    })
    
    channelRef.current = channel

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const msg = payload.new
        addLog(`📨 New message: ${msg.sender_display_name} says "${msg.content}"`)
        
        // Don't add duplicate messages
        setMessages(prev => {
          // Check if we already have this message
          if (prev.some(m => m.id === msg.id)) {
            addLog('⏭️ Duplicate message ignored')
            return prev
          }
          addLog(`✅ Adding new message from ${msg.sender_display_name}`)
          return [...prev, msg]
        })
        
        // Auto-scroll to bottom
        setTimeout(() => {
          const chatDiv = document.getElementById('chat-messages')
          if (chatDiv) chatDiv.scrollTop = chatDiv.scrollHeight
        }, 100)
      })
      .subscribe((status) => {
        addLog(`📡 Channel status: ${status}`)
        
        if (status === 'SUBSCRIBED') {
          addLog(`✅ Successfully subscribed to messages!`)
        } else if (status === 'CHANNEL_ERROR') {
          addLog(`❌ Channel error - will auto-reconnect`)
          // Auto-reconnect logic in Supabase client handles this
        } else if (status === 'CLOSED') {
          addLog(`🔌 Channel closed - will reconnect if needed`)
        }
      })
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentSession || !session) return

    try {
      const message = {
        session_id: currentSession.id,
        sender_id: session.guest_id,
        sender_is_guest: true,
        sender_display_name: session.display_name,
        content: messageInput,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase.from('messages').insert(message)
      
      if (error) throw error
      
      setMessageInput('')
      addLog(`✉️ You sent: ${messageInput}`)
    } catch (err: any) {
      addLog(`❌ Failed to send: ${err.message}`)
    }
  }

  const leaveQueue = async () => {
    if (!session) return
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)
    setInQueue(false)
    addLog('🚪 Left queue')
  }

  const endChat = async () => {
    if (!currentSession) return
    
    // Clean up channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    await supabase
      .from('chat_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', currentSession.id)
    
    setInChat(false)
    setCurrentSession(null)
    setMessages([])
    addLog('👋 Chat ended')
  }

  const reset = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    supabase.removeAllChannels()
    
    if (session) {
      supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)
    }
    
    setSession(null)
    setInQueue(false)
    setInChat(false)
    setCurrentSession(null)
    setMessages([])
    setLogs([])
    addLog('🔄 Reset complete')
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto', background: '#0a0a1a', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ color: '#0ff', textAlign: 'center' }}>🐞 AUTO-MATCH DEBUG</h1>
      <p style={{ textAlign: 'center', color: '#999', marginBottom: '20px' }}>Now with 1-second aggressive polling!</p>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={testConnection} style={buttonStyle}>Test Connection</button>
        <button onClick={testGuestSession} style={buttonStyle}>Create Guest</button>
        {!inQueue && !inChat && session && (
          <button onClick={testQueue} style={{...buttonStyle, background: '#0f0', color: '#000'}}>
            Join Queue
          </button>
        )}
        {inQueue && (
          <>
            <button onClick={forceCheck} style={{...buttonStyle, background: '#ff0', color: '#000'}}>
              🔍 Force Check
            </button>
            <button onClick={leaveQueue} style={{...buttonStyle, background: '#f00', color: '#fff'}}>
              Leave Queue
            </button>
          </>
        )}
        {inChat && (
          <button onClick={endChat} style={{...buttonStyle, background: '#f00', color: '#fff'}}>
            End Chat
          </button>
        )}
        <button onClick={reset} style={{...buttonStyle, background: '#666'}}>Reset</button>
        <button onClick={() => setLogs([])} style={buttonStyle}>Clear Logs</button>
      </div>

      {session && (
        <div style={{ background: '#1a1a2e', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #0ff' }}>
          <div><strong style={{ color: '#0ff' }}>Name:</strong> <span style={{ color: '#ff0', fontWeight: 'bold', fontSize: '18px' }}>{session.display_name}</span></div>
          <div><strong style={{ color: '#0ff' }}>ID:</strong> {session.guest_id.slice(0, 8)}...</div>
          <div><strong style={{ color: '#0ff' }}>Status:</strong> 
            <span style={{ 
              color: inChat ? '#0f0' : (inQueue ? '#ff0' : '#f00'),
              fontWeight: 'bold',
              marginLeft: '10px'
            }}>
              {inChat ? '💬 IN CHAT' : (inQueue ? '⏳ IN QUEUE' : '🔴 IDLE')}
            </span>
          </div>
        </div>
      )}

      {inChat && currentSession && (
        <div style={{ background: '#16213e', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #0f0' }}>
          <h3 style={{ color: '#0f0', marginBottom: '10px' }}>
            💬 CHAT ACTIVE - {currentSession.user1_id === session?.guest_id 
              ? currentSession.user2_display_name 
              : currentSession.user1_display_name}
          </h3>
          <div 
            id="chat-messages" 
            style={{ 
              height: '200px', 
              overflowY: 'auto', 
              background: '#1a1a2e', 
              padding: '10px', 
              marginBottom: '10px', 
              borderRadius: '5px',
              border: '1px solid #333'
            }}
          >
            {messages.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', paddingTop: '80px' }}>No messages yet. Say hi!</div>
            ) : (
              messages.map((msg, i) => (
                <div key={msg.id || i} style={{ 
                  color: msg.sender_id === session?.guest_id ? '#0ff' : '#ff0', 
                  marginBottom: '8px',
                  padding: '5px',
                  borderLeft: msg.sender_id === session?.guest_id ? '3px solid #0ff' : '3px solid #ff0',
                  paddingLeft: '10px',
                  background: msg.sender_id === session?.guest_id ? 'rgba(0,255,255,0.05)' : 'rgba(255,255,0,0.05)'
                }}>
                  <strong>{msg.sender_display_name}:</strong> {msg.content}
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{ 
                flex: 1, 
                padding: '10px',
                background: '#1a1a2e',
                border: '1px solid #0ff',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
            <button onClick={sendMessage} style={{...buttonStyle, padding: '10px 20px'}}>Send</button>
          </div>
        </div>
      )}

      <div style={{ 
        background: '#000', 
        color: '#0f0', 
        padding: '15px', 
        borderRadius: '8px',
        height: '400px',
        overflowY: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace',
        border: '1px solid #0f0'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', paddingTop: '180px' }}>Logs will appear here...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '3px', whiteSpace: 'pre-wrap' }}>{log}</div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', color: '#999', fontSize: '13px', padding: '15px', background: '#1a1a2e', borderRadius: '8px' }}>
        <p>✅ <strong style={{ color: '#0ff' }}>1-SECOND POLLING:</strong> Matches auto-detect in 1-2 seconds!</p>
        <p>🔍 <strong style={{ color: '#ff0' }}>Force Check:</strong> Manually trigger match check</p>
        <p>📡 <strong style={{ color: '#0f0' }}>Fixed Realtime:</strong> Clean channel management, no more one-sided messages</p>
      </div>
    </div>
  )
}

const buttonStyle = {
  padding: '10px 16px',
  background: '#0ff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  color: '#000',
  transition: 'all 0.2s'
}