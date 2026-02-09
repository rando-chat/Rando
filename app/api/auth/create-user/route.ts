import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { user_id, email, username } = await request.json();
    
    if (!user_id || !email || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('users')
      .insert({
        id: user_id,
        email,
        username,
        tier: 'free',
        age_verified: false,
        email_verified: false,
        preferences: {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Service role insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}