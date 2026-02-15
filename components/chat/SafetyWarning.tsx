'use client'

import { useEffect } from 'react'

interface SafetyWarningProps {
  message: string
  type?: 'warning' | 'error' | 'success' | 'info'
  duration?: number
  onClose: () => void
}

export function SafetyWarning({ 
  message, 
  type = 'warning', 
  duration = 3000, 
  onClose 
}: SafetyWarningProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const colors = {
    warning: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    error: { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
    success: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
    info: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }
  }

  const color = colors[type]

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: color.bg,
      color: color.text,
      borderLeft: `4px solid ${color.border}`,
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>⚠️</span>
        <span style={{ fontSize: '14px' }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            marginLeft: '12px',
            cursor: 'pointer',
            fontSize: '16px',
            color: color.text
          }}
        >
          ✕
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}