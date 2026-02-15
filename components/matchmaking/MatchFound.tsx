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
    }, 2000) // 2 seconds like debug

    return () => clearTimeout(timer)
  }, [match.id, router])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '400px',
        textAlign: 'center',
        animation: 'popIn 0.3s ease'
      }}>
        {/* Success emoji (like debug) */}
        <div style={{
          fontSize: '64px',
          marginBottom: '20px',
          animation: 'bounce 1s ease infinite'
        }}>
          ✨
        </div>
        
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          Match Found!
        </h2>
        
        {/* Partner name (like debug) */}
        <p style={{
          fontSize: '20px',
          color: '#667eea',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          {match.partnerName}
        </p>
        
        {/* Shared interests (like debug) */}
        {match.sharedInterests && match.sharedInterests.length > 0 && (
          <div style={{
            background: '#f3f4f6',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              Shared Interests
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {match.sharedInterests.map(interest => (
                <span key={interest} style={{
                  background: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#667eea',
                  border: '1px solid #e5e7eb'
                }}>
                  #{interest}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Redirect message (like debug) */}
        <p style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Redirecting to chat...
        </p>
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
      `}</style>
    </div>
  )
}