// app/api/chat/session/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/database/client'
import { getUserId } from '@/lib/database/client'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { match_user_id } = body

    if (!match_user_id) {
      return NextResponse.json(
        { error: 'Missing match_user_id' },
        { status: 400 }
      )
    }

    // Determine if users are guests
    const { data: { session } } = await supabase.auth.getSession()
    const user1IsGuest = !session?.user

    // Get user1 details
    let user1DisplayName = 'User'
    if (user1IsGuest) {
      const { data: guestData } = await supabase
        .from('guest_sessions')
        .select('display_name')
        .eq('id', userId)
        .single()
      if (guestData) user1DisplayName = guestData.display_name
    } else {
      const { data: userData } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .single()
      if (userData) user1DisplayName = userData.display_name
    }

    // Get user2 details and check if guest
    const { data: user2GuestData } = await supabase
      .from('guest_sessions')
      .select('display_name')
      .eq('id', match_user_id)
      .single()

    const user2IsGuest = !!user2GuestData
    let user2DisplayName = 'User'

    if (user2IsGuest && user2GuestData) {
      user2DisplayName = user2GuestData.display_name
    } else if (!user2IsGuest) {
      const { data: user2Data } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', match_user_id)
        .single()
      if (user2Data) user2DisplayName = user2Data.display_name
    }

    // Create the chat session
    const { data: chatSession, error: chatError } = await supabase
      .from('chat_sessions')
      .insert({
        user1_id: userId,
        user2_id: match_user_id,
        user1_is_guest: user1IsGuest,
        user2_is_guest: user2IsGuest,
        user1_display_name: user1DisplayName,
        user2_display_name: user2DisplayName,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (chatError) {
      console.error('Chat session creation error:', chatError)
      return NextResponse.json(
        { error: 'Failed to create chat session', details: chatError.message },
        { status: 500 }
      )
    }

    // Update matchmaking queue to mark users as matched
    await supabase
      .from('matchmaking_queue')
      .update({ matched_at: new Date().toISOString() })
      .in('user_id', [userId, match_user_id])
      .is('matched_at', null)

    return NextResponse.json({
      success: true,
      chat_session: chatSession
    })

  } catch (error: any) {
    console.error('Unexpected error creating chat session:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get chat sessions for this user
    const { data: { session } } = await supabase.auth.getSession()
    const isGuest = !session?.user

    let query = supabase
      .from('chat_sessions')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(10)

    // If guest, add guest condition
    if (isGuest) {
      query = query.or(`and(user1_id.eq.${userId},user1_is_guest.eq.true),and(user2_id.eq.${userId},user2_is_guest.eq.true)`)
    }

    const { data: chatSessions, error } = await query

    if (error) {
      console.error('Error fetching chat sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chat sessions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chat_sessions: chatSessions || []
    })

  } catch (error: any) {
    console.error('Unexpected error fetching chat sessions:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    )
  }
}