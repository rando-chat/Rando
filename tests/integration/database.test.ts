import { supabase } from '@/lib/supabase/client'
import {
  getUserProfile,
  updateUserProfile,
  getChatMessages,
  sendMessage,
  createChatSession,
  endChatSession,
} from '@/lib/database/queries'

// Mock Supabase client
jest.mock('@/lib/supabase/client')

describe('Database Queries - User Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getUserProfile fetches user by ID', async () => {
    const mockUser = {
      id: 'user-123',
      display_name: 'Test User',
      tier: 'free',
      interests: ['gaming'],
    }

    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUser }),
        }),
      }),
    })

    const result = await getUserProfile('user-123')
    expect(result).toEqual(mockUser)
  })

  test('updateUserProfile updates user fields', async () => {
    const updates = { display_name: 'Updated Name', bio: 'New bio' }

    ;(supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })

    await updateUserProfile('user-123', updates)

    expect(supabase.from).toHaveBeenCalledWith('users')
  })
})

describe('Database Queries - Chat', () => {
  test('getChatMessages retrieves messages for session', async () => {
    const mockMessages = [
      { id: 'msg-1', content: 'Hello', sender_id: 'user-1' },
      { id: 'msg-2', content: 'Hi there', sender_id: 'user-2' },
    ]

    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockMessages }),
        }),
      }),
    })

    const messages = await getChatMessages('session-123')
    expect(messages).toHaveLength(2)
  })

  test('sendMessage creates new message', async () => {
    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    })

    await sendMessage({
      session_id: 'session-123',
      sender_id: 'user-123',
      content: 'Test message',
    })

    expect(supabase.from).toHaveBeenCalledWith('messages')
  })

  test('createChatSession creates new session', async () => {
    const mockSession = {
      id: 'session-123',
      user1_id: 'user-1',
      user2_id: 'user-2',
      status: 'active',
    }

    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockSession }),
        }),
      }),
    })

    const session = await createChatSession('user-1', 'user-2')
    expect(session).toEqual(mockSession)
  })

  test('endChatSession updates session status', async () => {
    ;(supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })

    await endChatSession('session-123')

    expect(supabase.from).toHaveBeenCalledWith('chat_sessions')
  })
})

describe('Database Queries - Analytics', () => {
  test('tracks analytics event', async () => {
    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    })

    const { trackEvent } = await import('@/lib/analytics/tracking')

    await trackEvent('user_signup', 'user-123', { tier: 'free' })

    expect(supabase.from).toHaveBeenCalledWith('analytics_events')
  })
})

describe('Database Queries - Content Safety', () => {
  test('check_content_advanced validates message', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: { is_safe: true, safety_score: 0.95 },
    })

    const result = await supabase.rpc('check_content_advanced', {
      p_content: 'Hello, how are you?',
    })

    expect(result.data.is_safe).toBe(true)
  })
})
