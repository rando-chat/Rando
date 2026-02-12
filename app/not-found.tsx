import Link from 'next/link'

export default function NotFound() {
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
          width: 120,
          height: 120,
          margin: '0 auto 24px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 60,
        }}>
          ­Ъци
        </div>

        <h1 style={{
          fontSize: 72,
          fontWeight: 800,
          marginBottom: 8,
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
          color: '#1f2937',
        }}>
          Page Not Found
        </h2>

        <p style={{
          fontSize: 16,
          color: '#6b7280',
          marginBottom: 32,
          lineHeight: 1.6,
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/"
            style={{
              padding: '12px 24px',
              background: '#7c3aed',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              display: 'inline-block',
              transition: 'all 0.2s',
            }}
          >
            Go Home
          </Link>

          <Link 
            href="/matchmaking"
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: '#7c3aed',
              textDecoration: 'none',
              border: '1px solid #7c3aed',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              display: 'inline-block',
              transition: 'all 0.2s',
            }}
          >
            Start Chatting
          </Link>
        </div>
      </div>
    </div>
  )
}