'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SimpleDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string>('')

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
        addLog(`   Session token: ${session.session_token.slice(0, 8)}...`)
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
      
      // Leave queue first
      await supabase.from('matchmaking_queue').delete().eq('user_id', session.guest_id)

      // Join queue
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

      // Check queue
      const { data: queue } = await supabase
        .from('matchmaking_queue')
        .select('display_name')
        .is('matched_at', null)
      
      addLog(`📊 Queue has ${queue?.length || 0} users`)
      
    } catch (err: any) {
      addLog(`❌ Failed: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#0ff' }}>🐞 SIMPLE DEBUG PAGE</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={testConnection} style={buttonStyle}>
          Test Connection
        </button>
        <button onClick={testGuestSession} style={buttonStyle}>
          Create Guest Session
        </button>
        <button onClick={testQueue} style={buttonStyle}>
          Join Queue
        </button>
        <button onClick={() => setLogs([])} style={buttonStyle}>
          Clear Logs
        </button>
      </div>

      {session && (
        <div style={{ background: '#1a1a2e', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          <div><strong style={{ color: '#0ff' }}>Session:</strong> {session.guest_id.slice(0, 8)}...</div>
          <div><strong style={{ color: '#0ff' }}>Name:</strong> <span style={{ color: '#ff0' }}>{session.display_name}</span></div>
        </div>
      )}

      <div style={{ 
        background: '#000', 
        color: '#0f0', 
        padding: '10px', 
        borderRadius: '5px',
        height: '400px',
        overflowY: 'auto',
        fontSize: '12px'
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      <div style={{ marginTop: '20px', color: '#999' }}>
        <p>✅ This page has NO complex components - just buttons and logs</p>
        <p>❌ If this page crashes, the issue is in your database/supabase</p>
        <p>✅ If this page works, the issue is in your main app components</p>
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
  fontWeight: 'bold'
}