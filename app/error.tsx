'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'white',
        borderRadius: 16,
        padding: 48,
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 24px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
        }}>
          ⚠️
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
          color: '#1f2937',
        }}>
          Something went wrong
        </h1>

        <p style={{
          fontSize: 16,
          color: '#6b7280',
          marginBottom: 24,
          lineHeight: 1.6,
        }}>
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>

        <div style={{
          padding: 16,
          background: '#f9fafb',
          borderRadius: 8,
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <p style={{
            fontSize: 12,
            color: '#6b7280',
            fontFamily: 'monospace',
            wordBreak: 'break-word',
          }}>
            {error.message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}