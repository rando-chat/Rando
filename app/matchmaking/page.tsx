'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function MatchmakingPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [isWaiting, setIsWaiting] = useState(false) // Changed from isInQueue
  const [estimatedWait, setEstimatedWait] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  // Generate UUID fallback
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Initialize guest session
  useEffect(() => {
    const initialize = async () => {
      try {
        addLog('🎨 Creating guest session...')
        const { data, error } = await supabase.rpc('create_guest_session', {
          p_ip_address: null,
          p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          p_country_code: null
        })

        if (error) throw error

        if (data && data.length > 0) {
          const guestSession = data[0]
          setSession(guestSession)
          addLog(`✅ Got fun name: ${guestSession.display_name}`)
        } else {
          throw new Error('No guest session')
        }

        setIsInitializing(false)
        
        // Start polling immediately
        addLog('⏱️ Starting background polling...')
        startPolling()
        
      } catch (err) {
        addLog(`❌ Init error: ${err}`)
        const uuid = generateUUID()
        setSession({
          guest_id: uuid,
          display_name: 'Guest_' + uuid.slice(0, 8)
        })
        setIsInitializing(false)
        startPolling()
      }
    }

    initialize()
  }, [])

  // Start polling function
  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    
    // Immediate first check
    setTimeout(() => checkForMatch(), 100)
    
    // Then interval
    pollingRef.current = setInterval(() => checkForMatch(), 500)
  }

  // Check for match - NOW USING DIRECT QUEUE CHECK
  const checkForMatch = async () => {
    addLog('🔍 Polling... checking for match')
    
    if (!session) {
      addLog('❌ No session')
      return
    }

    try {
      // Check for existing session FIRST
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
        router.push(`/chat/${existingSession.id}`)
        return
      }

      // Check if I'm in queue
      const { data: myQueueEntry } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .eq('user_id', session.guest_id)
        .is('matched_at', null)
        .maybeSingle()

      const amIInQueue = !!myQueueEntry

      // Update UI state based on queue status
      if (amIInQueue !== isWaiting) {
        setIsWaiting(amIInQueue)
      }

      if (!amIInQueue) {
        addLog('⏸️ Not in queue')
        return
      }

      // Get ALL queue entries
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .is('matched_at', null)
        .order('entered_at', { ascending: true })

      if (!queue || queue.length === 0) {
        addLog('📭 Queue empty')
        return
      }

      addLog(`📊 QUEUE (${queue.length} users):`)
      queue.forEach((entry, i) => {
        const isMe = entry.user_id === session.guest_id
        addLog(`   ${i+1}. ${entry.display_name} ${isMe ? '👤 YOU' : ''}`)
      })

      // If only me in queue, wait
      if (queue.length === 1) {
        addLog('⏳ Alone in queue - waiting...')
        setEstimatedWait(prev => Math.max(5, prev - 1))
        return
      }

      // Find partner (first person not me)
      const partner = queue.find(u => u.user_id !== session.guest_id)
      if (!partner) {
        addLog('⏳ No partner found')
        return
      }

      addLog(`🎯 Found partner: ${partner.display_name}`)

      // EXACT SAME LOGIC AS DEBUG PAGE
      const shouldCreate = session.guest_id < partner.user_id
      addLog(`🎲 ${shouldCreate ? 'I CREATE session' : 'WAITING for partner to create'}`)

      if (shouldCreate) {
        addLog('🔨 Creating chat session...')
        
        await supabase
          .from('matchmaking_queue')
          .update({ matched_at: new Date().toISOString() })
          .in('user_id', [session.guest_id, partner.user_id])

        const { data: newSession } = await supabase
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

        if (newSession) {
          addLog(`✅ Session created! ID: ${newSession.id.slice(0, 8)}...`)
          await supabase.from('matchmaking_queue').delete().in('user_id', [session.guest_id, partner.user_id])
          
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          
          router.push(`/chat/${newSession.id}`)
        }
      } else {
        addLog('🎲 WAITING for partner to create')
        setEstimatedWait(prev => Math.max(5, prev - 1))
      }
    } catch (err) {
      addLog(`❌ Check error: ${err}`)
    }
  }

  // SIMPLIFIED handleStartChatting
  const handleStartChatting = async () => {
    if (!session) return

    setIsLoading(true)
    addLog('🎯 Joining queue...')
    
    try {
      // Clean up any old queue entries
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)

      // Join queue
      await supabase.from('matchmaking_queue').insert({
        user_id: session.guest_id,
        display_name: session.display_name,
        is_guest: true,
        tier: 'free',
        interests: [],
        entered_at: new Date().toISOString()
      })

      addLog('✅ Joined queue')
      setIsWaiting(true)
      setEstimatedWait(30)
      
      // FORCE CHECK IMMEDIATELY
      addLog('🔍 FORCE CHECKING NOW...')
      setTimeout(() => checkForMatch(), 500)
      
    } catch (err) {
      addLog(`❌ Join error: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    addLog('🚪 Cancelling...')
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (session) {
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)
    }
    setIsWaiting(false)
    setEstimatedWait(30)
    addLog('✅ Cancelled')
    
    // Restart polling
    startPolling()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  if (isInitializing) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            margin: '0 auto 20px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 18 }}>Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'white',
        borderRadius: 20,
        padding: 40,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {!isWaiting ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 20, textAlign: 'center' }}>💬</div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 10, color: '#1f2937', textAlign: 'center' }}>
              Ready to Chat
            </h1>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 10, textAlign: 'center' }}>
              Click below to find a random stranger
            </p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 30, textAlign: 'center' }}>
              You are: <strong style={{ color: '#667eea' }}>{session?.display_name || 'Loading...'}</strong>
            </p>

            <button
              onClick={handleStartChatting}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: 18,
                fontWeight: 600,
                color: 'white',
                background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 12,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              {isLoading ? 'Joining...' : 'Find a Stranger'}
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 80,
              height: 80,
              margin: '0 auto 24px',
              border: '6px solid #f3f4f6',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1f2937', textAlign: 'center' }}>
              Finding your match...
            </h2>
            
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 8, textAlign: 'center' }}>
              Looking for someone interesting to talk to
            </p>

            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#f3f4f6',
              borderRadius: 20,
              fontSize: 14,
              color: '#667eea',
              fontWeight: 600,
              marginBottom: 24,
              marginLeft: 'auto',
              marginRight: 'auto',
              textAlign: 'center'
            }}>
              {estimatedWait}s
              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>
                {' '}Est. remaining
              </span>
            </div>

            <button
              onClick={handleCancel}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                color: '#6b7280',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'block',
                margin: '0 auto'
              }}
            >
              Cancel
            </button>
          </>
        )}

        {/* Debug logs */}
        <div style={{
          marginTop: 30,
          padding: 15,
          background: '#1a1a2e',
          color: '#0f0',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 12,
          maxHeight: 200,
          overflowY: 'auto'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center' }}>Logs will appear here...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ marginBottom: 3 }}>{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}