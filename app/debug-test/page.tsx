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
        const session = data[0]
        setSession(session)
        addLog(`✅ Got fun name: ${session.display_name}`)
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

      // Start checking for match
      startMatchChecking()

    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`)
    }
  }

  const startMatchChecking = () => {
    addLog('⏱️ Checking for match every 2 seconds...')
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    pollingRef.current = setInterval(checkForMatch, 2000)
    setTimeout(checkForMatch, 100)
  }

  const forceCheck = async () => {
    addLog('🔍 FORCE CHECKING NOW...')
    await checkForMatch()
  }

  const checkForMatch = async () => {
    if (!session || !inQueue) return

    try {
      // Check if already in chat
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${session.guest_id},user2_id.eq.${session.guest_id}`)
        .eq('status', 'active')
        .maybeSingle()

      if (existingSession) {
        addLog(`✅ MATCH FOUND! Session: ${existingSession.id.slice(0, 8)}...`)
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setInQueue(false)
        setInChat(true)
        setCurrentSession(existingSession)
        loadMessages(existingSession.id)
        subscribeToMessages(existingSession.id)
        return
      }

      // Get ALL queue entries with full details
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
          addLog(`   ${i+1}. ${entry.display_name} ${isMe ? '👤 YOU' : ''} - entered: ${new Date(entry.entered_at).toLocaleTimeString()}`)
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
    supabase
      .channel(`chat-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const msg = payload.new
        setMessages(prev => [...prev, msg])
        addLog(`💬 ${msg.sender_display_name}: ${msg.content}`)
      })
      .subscribe()
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentSession || !session) return

    try {
      await supabase.from('messages').insert({
        session_id: currentSession.id,
        sender_id: session.guest_id,
        sender_is_guest: true,
        sender_display_name: session.display_name,
        content: messageInput,
        created_at: new Date().toISOString()
      })
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
    await supabase
      .from('chat_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', currentSession.id)
    setInChat(false)
    setCurrentSession(null)
    setMessages([])
    addLog('👋 Chat ended')
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#0ff' }}>🐞 FULL DEBUG PAGE</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={testConnection} style={buttonStyle}>Test Connection</button>
        <button onClick={testGuestSession} style={buttonStyle}>Create Guest</button>
        {!inQueue && !inChat && session && (
          <button onClick={testQueue} style={buttonStyle}>Join Queue</button>
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
        <button onClick={() => setLogs([])} style={buttonStyle}>Clear Logs</button>
      </div>

      {session && (
        <div style={{ background: '#1a1a2e', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          <div><strong style={{ color: '#0ff' }}>Name:</strong> <span style={{ color: '#ff0', fontWeight: 'bold' }}>{session.display_name}</span></div>
          <div><strong style={{ color: '#0ff' }}>ID:</strong> {session.guest_id.slice(0, 8)}...</div>
          <div><strong style={{ color: '#0ff' }}>Status:</strong> {inChat ? 'IN CHAT' : (inQueue ? 'IN QUEUE' : 'IDLE')}</div>
        </div>
      )}

      {inChat && currentSession && (
        <div style={{ background: '#16213e', padding: '10px', borderRadius: '5px', marginBottom: '20px', border: '1px solid #0f0' }}>
          <h3 style={{ color: '#0f0' }}>💬 CHAT ACTIVE</h3>
          <div style={{ height: '150px', overflowY: 'auto', background: '#1a1a2e', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            {messages.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center' }}>No messages yet</div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ color: msg.sender_id === session.guest_id ? '#0ff' : '#ff0', marginBottom: '5px' }}>
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
                padding: '8px',
                background: '#1a1a2e',
                border: '1px solid #0ff',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <button onClick={sendMessage} style={buttonStyle}>Send</button>
          </div>
        </div>
      )}

      <div style={{ 
        background: '#000', 
        color: '#0f0', 
        padding: '10px', 
        borderRadius: '5px',
        height: '400px',
        overflowY: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '2px', whiteSpace: 'pre-wrap' }}>{log}</div>
        ))}
      </div>

      <div style={{ marginTop: '20px', color: '#999', fontSize: '12px' }}>
        <p>✅ Click <strong style={{ color: '#ff0' }}>Force Check</strong> on one phone to force match</p>
        <p>📱 If they don't match, check if both are in the same queue</p>
      </div>
    </div>
  )
}

const buttonStyle = {
  padding: '8px 16px',
  background: '#0ff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px'
}