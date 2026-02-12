export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
    }}>
      <div style={{ textAlign: 'center' }}>
        {/* Animated spinner */}
        <div style={{
          width: 64,
          height: 64,
          margin: '0 auto 24px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <p style={{
          fontSize: 18,
          color: '#6b7280',
          fontWeight: 500,
        }}>
          Loading...
        </p>
      </div>
    </div>
  )
}