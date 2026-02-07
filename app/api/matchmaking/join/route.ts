// app/api/matchmaking/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/database/client'
import { getUserId } from '@/lib/database/client'

export async function POST(request: NextRequest) {
  try {
    // Get current user ID (guest or registered)
    const userId = await getUserId()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const {
      interests = [],
      language = 'en',
      looking_for = ['text'],
      match_preferences = { min_age: 18, max_age: 99 }
    } = body

    // Determine if user is guest or registered
    let isGuest = false
    let displayName = 'Anonymous'
    let tier = 'free' as const

    // Check auth session first
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Registered user
      const { data: userData } = await supabase
        .from('users')
        .select('display_name, tier')
        .eq('id', userId)
        .single()

      if (userData) {
        displayName = userData.display_name
        tier = userData.tier
      }
    } else {
      // Guest user
      isGuest = true
      const { data: guestData } = await supabase
        .from('guest_sessions')
        .select('display_name')
        .eq('id', userId)
        .single()

      if (guestData) {
        displayName = guestData.display_name
      }
    }

    // Check if user is already in queue
    const { data: existingQueue } = await supabase
      .from('matchmaking_queue')
      .select('id')
      .eq('user_id', userId)
      .eq('is_guest', isGuest)
      .is('matched_at', null)
      .maybeSingle()

    if (existingQueue) {
      return NextResponse.json({
        success: false,
        message: 'Already in queue',
        queue_id: existingQueue.id,
        estimated_wait_time: 30 // Default estimate
      })
    }

    // Insert into matchmaking queue
    const { data: queueEntry, error: queueError } = await supabase
      .from('matchmaking_queue')
      .insert({
        user_id: userId,
        is_guest: isGuest,
        display_name: displayName,
        tier: tier,
        interests: interests,
        language_preference: language,
        looking_for: looking_for,
        match_preferences: match_preferences,
        queue_score: 50, // Default score
        last_ping_at: new Date().toISOString()
      })
      .select()
      .single()

    if (queueError) {
      console.error('Queue insertion error:', queueError)
      return NextResponse.json(
        { error: 'Failed to join queue', details: queueError.message },
        { status: 500 }
      )
    }

    // Try to find an immediate match using the matchmaking function
    const { data: matchData, error: matchError } = await supabase.rpc('match_users_v2', {
      p_user_id: userId,
      p_is_guest: isGuest,
      p_user_tier: tier,
      p_user_interests: interests,
      p_min_age: match_preferences.min_age,
      p_max_age: match_preferences.max_age
    })

    if (matchError) {
      console.error('Matchmaking error:', matchError)
      // Continue anyway, user is in queue
    }

    let matchResult = null
    let chatSessionId = null

    // If we found a match, create a chat session
    if (matchData && matchData.length > 0 && matchData[0].match_user_id) {
      const match = matchData[0]
      
      // Mark both users as matched in queue
      await supabase
        .from('matchmaking_queue')
        .update({ matched_at: new Date().toISOString() })
        .in('user_id', [userId, match.match_user_id])

      // Create chat session
      const { data: chatSession, error: chatError } = await supabase
        .from('chat_sessions')
        .insert({
          user1_id: userId,
          user2_id: match.match_user_id,
          user1_is_guest: isGuest,
          user2_is_guest: match.match_is_guest,
          user1_display_name: displayName,
          user2_display_name: match.match_display_name,
          status: 'active',
          shared_interests: match.shared_interests,
          match_score: match.match_score,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!chatError && chatSession) {
        chatSessionId = chatSession.id
        matchResult = {
          matched_with: match.match_display_name,
          match_score: match.match_score,
          shared_interests: match.shared_interests,
          chat_session_id: chatSession.id
        }
      }
    }

    return NextResponse.json({
      success: true,
      queue_id: queueEntry.id,
      in_queue: !matchResult,
      match: matchResult,
      estimated_wait_time: matchData?.[0]?.estimated_wait_time || 30
    })

  } catch (error: any) {
    console.error('Unexpected error in matchmaking:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get is_guest status
    const { data: { session } } = await supabase.auth.getSession()
    const isGuest = !session?.user

    // Remove from queue
    const { error } = await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('user_id', userId)
      .eq('is_guest', isGuest)
      .is('matched_at', null)

    if (error) {
      console.error('Queue removal error:', error)
      return NextResponse.json(
        { error: 'Failed to leave queue', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Left the matchmaking queue'
    })

  } catch (error: any) {
    console.error('Unexpected error leaving queue:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}