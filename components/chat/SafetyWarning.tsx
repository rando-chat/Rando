'use client'

import { useEffect } from 'react'

interface SafetyWarningProps {
  message: string
  type: 'success' | 'warning' | 'error'
  onClose: () => void
}

export function SafetyWarning({ message, type, onClose }: SafetyWarningProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    success: { bg: 'rgba(34,197,94,0.1)', border: '#22c55e', text: '#86efac' },
    warning: { bg: 'rgba(234,179,8,0.1)', border: '#eab308', text: '#fde047' },
    error: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#fca5a5' }
  }

  const style = colors[type]

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '8px',
      padding: '12px 20px',
      color: style.text,
      fontSize: '14px',
      zIndex: 1000,
      animation: 'slideUp 0.3s ease',
      backdropFilter: 'blur(4px)',
    }}>
      {message}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}