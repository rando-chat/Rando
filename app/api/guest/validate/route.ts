// app/api/guest/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get('id')

    if (!guestId) {
      return NextResponse.json(
        { error: 'Missing guest ID' },
        { status: 400 }
      )
    }

    // Validate session with database
    const { data, error } = await supabase.rpc('get_guest_session_status', {
      p_guest_id: guestId
    })

    if (error) {
      console.error('Session validation error:', error)
      return NextResponse.json(
        { valid: false, error: 'Validation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Unexpected error in session validation:', error)
    return NextResponse.json(
      { 
        valid: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}