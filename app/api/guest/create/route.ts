// app/api/guest/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/database/client'
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitCheck = await checkRateLimit(
      request,
      RATE_LIMITS.CHAT.createSession.limit,
      RATE_LIMITS.CHAT.createSession.window
    )

    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: rateLimitCheck.message,
          retryAfter: rateLimitCheck.headers?.get('X-RateLimit-Reset')
        },
        { 
          status: 429,
          headers: rateLimitCheck.headers
        }
      )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Get country from Cloudflare header if available
    const country = request.headers.get('cf-ipcountry') || 
                   request.headers.get('x-vercel-ip-country') || 
                   null

    // Call the database function
    const { data, error } = await supabase.rpc('create_guest_session', {
      p_ip_address: ip,
      p_user_agent: userAgent.substring(0, 500), // Limit length
      p_country_code: country
    })

    if (error) {
      console.error('Guest session creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create guest session', details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No session data returned' },
        { status: 500 }
      )
    }

    const session = data[0]
    
    const response = NextResponse.json({
      success: true,
      guest_id: session.guest_id,
      session_token: session.session_token,
      display_name: session.display_name,
      expires_at: session.expires_at
    })

    // Add rate limit headers to successful response
    rateLimitCheck.headers?.forEach((value, key) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error: any) {
    console.error('Unexpected error in guest creation:', error)
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