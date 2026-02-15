'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MatchFoundProps {
  match: {
    id: string
    partnerName: string
    sharedInterests?: string[]
  }
  onCancel?: () => void
}

export function MatchFound({ match, onCancel }: MatchFoundProps) {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/chat/${match.id}`)
    }, 2000)

    return () => clearTimeout(timer)
  }, [match.id, router])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10,10,15,0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: 'clamp(16px, 4vw, 24px)',
        padding: 'clamp(24px, 6vw, 40px)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(124,58,237,0.3)',
        animation: 'popIn 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          animation: 'rotate 10s linear infinite',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            fontSize: 'clamp(48px, 15vw, 64px)',
            marginBottom: 'clamp(16px, 4vw, 20px)',
            animation: 'bounce 1s ease infinite'
          }}>
            ✨
          </div>
          
          <h2 style={{
            fontSize: 'clamp(24px, 6vw, 28px)',
            fontWeight: 'bold',
            color: '#f0f0f0',
            marginBottom: 'clamp(8px, 2vw, 12px)',
            fontFamily: "'Georgia', serif",
            background: 'linear-gradient(135deg, #ffffff, #e0e0ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Match Found!
          </h2>
          
          <p style={{
            fontSize: 'clamp(18px, 5vw, 20px)',
            color: '#7c3aed',
            fontWeight: 600,
            marginBottom: 'clamp(12px, 3vw, 16px)',
            fontFamily: "'Georgia', serif",
          }}>
            {match.partnerName}
          </p>
          
          {match.sharedInterests && match.sharedInterests.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 'clamp(8px, 2vw, 12px)',
              padding: 'clamp(10px, 2.5vw, 12px)',
              marginBottom: 'clamp(20px, 5vw, 24px)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}>
              <p style={{ 
                fontSize: 'clamp(11px, 2.8vw, 12px)', 
                color: '#a0a0b0', 
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Shared Interests
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                justifyContent: 'center', 
                flexWrap: 'wrap' 
              }}>
                {match.sharedInterests.map(interest => (
                  <span key={interest} style={{
                    background: 'rgba(124,58,237,0.1)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: 'clamp(11px, 2.8vw, 12px)',
                    color: '#7c3aed',
                    border: '1px solid rgba(124,58,237,0.3)',
                  }}>
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <p style={{
            fontSize: 'clamp(13px, 3.2vw, 14px)',
            color: '#60607a',
            fontStyle: 'italic',
          }}>
            Redirecting to chat...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
          div { 
            border-radius: 16px !important;
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  )
}