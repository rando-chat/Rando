'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase/client'

export const dynamic = 'force-static'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({ queue: 0, sessions: 0, polls: 0 })
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [isInQueue, setIsInQueue] = useState(false)
  const [connected, setConnected] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${time}] ${message}`])
    console.log(`[${type.toUpperCase()}]`, message)
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const updateStats = async () => {
    try {
      const [{ count: queueCount }, { count: sessionCount }] = await Promise.all([
        supabase.from('matchmaking_queue').select('id', { count: 'exact', head: true }).is('matched_at', null),
        supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      setStats(prev => ({ ...prev, queue: queueCount || 0, sessions: sessionCount || 0 }))
    } catch (error: any) {
      addLog('Error updating stats: ' + error.message, 'error')
    }
  }

  const initConnection = async () => {
    addLog('Connecting to Supabase...', 'info')
    try {
      // Test connection
      const { error } = await supabase.from('matchmaking_queue').select('count').limit(1)
      if (error) throw error

      addLog('✅ Connected to Supabase successfully', 'success')
      setConnected(true)

      // Create a REAL guest session with fun name from database
      addLog('🎨 Getting fun name from database...', 'info')
      
      const { data: guestSession, error: guestError } = await supabase
        .rpc('create_guest_session', {
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
          p_country_code: null
        });

      if (guestError) throw guestError;

      if (guestSession && guestSession.length > 0) {
        const session = guestSession[0];
        setMyUserId(session.guest_id);
        setDisplayName(session.display_name);
        addLog(`✨ Got fun name: ${session.display_name}`, 'success');
      } else {
        // Fallback to generated ID if something goes wrong
        const userId = generateUUID();
        setMyUserId(userId);
        setDisplayName('Guest_' + userId.slice(-4));
        addLog(`⚠️ Using fallback name: Guest_${userId.slice(-4)}`, 'warn');
      }

      // Start stats updates
      setInterval(updateStats, 3000)
      updateStats()
      
    } catch (error: any) {
      addLog('❌ Failed to connect: ' + error.message, 'error')
    }
  }

  const joinQueue = async () => {
    if (!myUserId) return

    addLog('🎯 Joining matchmaking queue...', 'info')

    try {
      // Clean up any existing queue entries
      await supabase.from('matchmaking_queue').delete().eq('user_id', myUserId)

      const { error } = await supabase.from('matchmaking_queue').insert({
        user_id: myUserId,
        display_name: displayName,
        is_guest: true,
        tier: 'free',
        interests: [],
        matched_at: null,
        entered_at: new Date().toISOString(),
      })

      if (error) throw error

      addLog(`✅ Joined queue as ${displayName}`, 'success')
      setIsInQueue(true)

      // Start polling for matches
      pollCountRef.current = 0
      pollIntervalRef.current = setInterval(pollForMatch, 2000)
      setTimeout(pollForMatch, 500)

    } catch (error: any) {
      addLog('❌ Failed to join queue: ' + error.message, 'error')
    }
  }

  const pollForMatch = async () => {
    if (!myUserId) return

    pollCountRef.current++
    setStats(prev => ({ ...prev, polls: pollCountRef.current }))

    try {
      addLog(`🔄 Poll #${pollCountRef.current}: Checking for match...`, 'info')

      // Check if already in a chat session
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`)
        .eq('status', 'active')
        .maybeSingle()

      if (existingSession) {
        addLog(`✅ MATCH FOUND! Session with ${existingSession.user1_id === myUserId ? existingSession.user2_display_name : existingSession.user1_display_name}`, 'success')
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        alert(`🎉 Matched! You're chatting now!`)
        return
      }

      // Get current queue
      const { data: allInQueue } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      addLog(`   📋 Total in queue: ${allInQueue?.length || 0}`, 'info')

      if (allInQueue && allInQueue.length > 0) {
        allInQueue.forEach((entry, i) => {
          const isMe = entry.user_id === myUserId
          addLog(`   ${i + 1}. ${entry.display_name} ${isMe ? '👤 YOU' : ''}`, 'info')
        })
      }

      // Find a partner (not yourself)
      const partner = allInQueue?.find(e => e.user_id !== myUserId)

      if (!partner) {
        addLog('   ⏳ No partner yet, waiting...', 'warn')
        return
      }

      addLog(`   👥 Found partner: ${partner.displayName || partner.display_name}`, 'success')

      // Deterministic decision: whoever has the smaller user_id creates the session
      const shouldCreate = myUserId < partner.user_id
      addLog(`   🎲 ${shouldCreate ? 'I create' : 'Partner creates'} session`, 'info')

      if (shouldCreate) {
        addLog('   🔨 Creating chat session...', 'info')

        // Mark both as matched
        await supabase
          .from('matchmaking_queue')
          .update({ matched_at: new Date().toISOString() })
          .in('user_id', [myUserId, partner.user_id])

        // Create the chat session
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user1_id: myUserId,
            user2_id: partner.user_id,
            user1_display_name: displayName,
            user2_display_name: partner.display_name,
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (sessionError) {
          addLog('   ❌ Session creation failed: ' + sessionError.message, 'error')
          // Rollback the matched_at update
          await supabase
            .from('matchmaking_queue')
            .update({ matched_at: null })
            .in('user_id', [myUserId, partner.user_id])
          return
        }

        addLog(`   ✅ Session created with ${partner.display_name}!`, 'success')

        // Remove from queue
        await supabase.from('matchmaking_queue').delete().in('user_id', [myUserId, partner.user_id])

        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        alert(`🎉 MATCHED with ${partner.display_name}!`)
      } else {
        addLog('   ⏳ Waiting for partner to create session...', 'warn')
      }

    } catch (error: any) {
      addLog('❌ Polling error: ' + error.message, 'error')
    }
  }

  const leaveQueue = async () => {
    if (!myUserId) return

    addLog('🚪 Leaving queue...', 'info')

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    try {
      await supabase.from('matchmaking_queue').delete().eq('user_id', myUserId)
      addLog('✅ Left queue', 'success')
      setIsInQueue(false)
      pollCountRef.current = 0
      setStats(prev => ({ ...prev, polls: 0 }))
    } catch (error: any) {
      addLog('❌ Error leaving queue: ' + error.message, 'error')
    }
  }

  const checkQueue = async () => {
    addLog('🔍 Checking queue...', 'info')

    try {
      const { data } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      addLog(`📋 Queue has ${data?.length || 0} users:`, 'info')
      data?.forEach((entry, i) => {
        addLog(`   ${i + 1}. ${entry.display_name} (${entry.user_id.slice(0, 8)}...)`, 'info')
      })
    } catch (error: any) {
      addLog('❌ Error: ' + error.message, 'error')
    }
  }

  useEffect(() => {
    addLog('🚀 Debug tool loaded. Click "Connect" to start.', 'info')
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: 30, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>🔍 Matchmaking Debug</h1>
          <p style={{ opacity: 0.9, fontSize: 14 }}>Real-time diagnostics with fun names! 🎨</p>
        </div>

        <div style={{ padding: 30 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#667eea' }}>{stats.queue}</div>
              <div style={{ fontSize: 12, color: '#6c757d' }}>IN QUEUE</div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#667eea' }}>{stats.sessions}</div>
              <div style={{ fontSize: 12, color: '#6c757d' }}>ACTIVE CHATS</div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#667eea' }}>{stats.polls}</div>
              <div style={{ fontSize: 12, color: '#6c757d' }}>POLLS</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!connected && (
              <button onClick={initConnection} style={{ padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Connect
              </button>
            )}
            {connected && !isInQueue && (
              <button onClick={joinQueue} style={{ padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Join Queue
              </button>
            )}
            {connected && isInQueue && (
              <button onClick={leaveQueue} style={{ padding: '12px 24px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Leave Queue
              </button>
            )}
            {connected && (
              <>
                <button onClick={checkQueue} style={{ padding: '12px 24px', background: 'white', color: '#667eea', border: '2px solid #667eea', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  Check Queue
                </button>
                <button onClick={() => setLogs([])} style={{ padding: '12px 24px', background: 'white', color: '#667eea', border: '2px solid #667eea', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  Clear Logs
                </button>
              </>
            )}
          </div>

          {/* User Info */}
          {myUserId && (
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
              <strong>Your ID:</strong> {myUserId.slice(0, 8)}...<br/>
              <strong>Display Name:</strong> <span style={{ color: '#667eea', fontWeight: 'bold' }}>
                {displayName || 'Guest_' + myUserId.slice(-4)}
              </span>
            </div>
          )}

          {/* Logs */}
          <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: 13, maxHeight: 400, overflowY: 'auto' }}>
            {logs.length === 0 ? 'Waiting for activity...' : logs.map((log, i) => (
              <div key={i} style={{ marginBottom: 4, whiteSpace: 'pre-wrap' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}