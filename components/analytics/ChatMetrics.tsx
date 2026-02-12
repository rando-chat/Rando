'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function ChatMetrics() {
  const [metrics, setMetrics] = useState({
    totalChats: 0,
    activeChats: 0,
    avgDuration: 0,
    messagesPerChat: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const [{ count: totalChats }, { count: activeChats }, { data: sessions }] = await Promise.all([
        supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('chat_sessions').select('started_at, ended_at, id').not('ended_at', 'is', null).limit(100),
      ])

      // Calculate avg duration
      let totalDuration = 0
      if (sessions && sessions.length > 0) {
        sessions.forEach(s => {
          if (s.started_at && s.ended_at) {
            const duration = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
            totalDuration += duration
          }
        })
      }
      const avgDuration = sessions && sessions.length > 0 ? totalDuration / sessions.length / 60000 : 0

      // Get messages per chat
      const { count: messageCount } = await supabase.from('messages').select('id', { count: 'exact', head: true })
      const messagesPerChat = totalChats && totalChats > 0 ? (messageCount || 0) / totalChats : 0

      setMetrics({
        totalChats: totalChats || 0,
        activeChats: activeChats || 0,
        avgDuration: Math.round(avgDuration),
        messagesPerChat: Math.round(messagesPerChat),
      })
    } catch (error) {
      console.error('Error loading chat metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading metrics...</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      {[
        { label: 'Total Chats', value: metrics.totalChats.toLocaleString(), color: '#7c3aed' },
        { label: 'Active Now', value: metrics.activeChats.toLocaleString(), color: '#22c55e' },
        { label: 'Avg Duration', value: `${metrics.avgDuration}m`, color: '#3b82f6' },
        { label: 'Msgs/Chat', value: metrics.messagesPerChat.toLocaleString(), color: '#f59e0b' },
      ].map((m, i) => (
        <div key={i} style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>{m.label}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: m.color }}>{m.value}</div>
        </div>
      ))}
    </div>
  )
}