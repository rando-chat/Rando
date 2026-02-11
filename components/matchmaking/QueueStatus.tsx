'use client'
import { useEffect, useState } from 'react'

interface QueueStatusProps {
  position: number
  estimatedWait: number
  onLeave: () => void
}

export function QueueStatus({ position, estimatedWait, onLeave }: QueueStatusProps) {
  const [dots, setDots] = useState('.')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 500)
    const timeInterval = setInterval(() => {
      setElapsed(e => e + 1)
    }, 1000)
    return () => { clearInterval(dotsInterval); clearInterval(timeInterval) }
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      {/* Animated pulse rings */}
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 32px' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(124,58,237,0.3)',
          animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 10, borderRadius: '50%',
          border: '2px solid rgba(124,58,237,0.5)',
          animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite 0.3s',
        }} />
        <div style={{
          position: 'absolute', inset: 20, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          🔍
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Finding your match{dots}
      </h2>

      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Looking for someone interesting to talk to
      </p>

      <div style={{
        display: 'inline-flex', gap: 32, padding: '16px 32px',
        background: '#f9fafb', borderRadius: 12, marginBottom: 32,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>
            {elapsed}s
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Waiting</div>
        </div>
        <div style={{ width: 1, background: '#e5e7eb' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>
            ~{Math.max(1, estimatedWait - elapsed)}s
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Est. remaining</div>
        </div>
      </div>

      <div>
        <button
          onClick={onLeave}
          style={{
            padding: '12px 32px',
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.2s',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}