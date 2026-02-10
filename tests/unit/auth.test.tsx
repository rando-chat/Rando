import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { AuthGuard } from '@/components/auth/AuthGuard'

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null })),
        })),
      })),
    })),
  },
}))

describe('AuthProvider', () => {
  test('renders children when authenticated', async () => {
    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  test('provides auth context to children', async () => {
    const TestComponent = () => {
      const { user } = useAuth()
      return <div>{user ? 'Logged In' : 'Guest'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Guest|Logged In/)).toBeInTheDocument()
    })
  })
})

describe('AuthGuard', () => {
  test('renders children when user is authenticated', () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    
    render(
      <AuthProvider>
        <AuthGuard requireUser>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.queryByText('Protected Content')).toBeInTheDocument()
  })

  test('redirects when user is not authenticated', () => {
    render(
      <AuthProvider>
        <AuthGuard requireUser>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  test('shows loading state initially', () => {
    render(
      <AuthProvider>
        <AuthGuard requireUser>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

describe('Guest Session', () => {
  test('creates guest session when no user exists', async () => {
    const { createGuestSession } = await import('@/lib/auth/guest')
    
    const session = createGuestSession()
    
    expect(session).toHaveProperty('guestId')
    expect(session).toHaveProperty('createdAt')
    expect(session).toHaveProperty('expiresAt')
  })

  test('guest session expires after 24 hours', () => {
    const { isGuestSessionValid } = await import('@/lib/auth/guest')
    
    const expiredSession = {
      guestId: '123',
      createdAt: Date.now() - 25 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1 * 60 * 60 * 1000,
    }

    expect(isGuestSessionValid(expiredSession)).toBe(false)
  })
})
