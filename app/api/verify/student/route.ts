import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { verifyStudentEmail, generateVerificationCode, sendVerificationEmail } from '@/lib/payments/student'

const codes = new Map<string, string>()

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!verifyStudentEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid student email' }), { status: 400 })
  }

  const code = generateVerificationCode()
  codes.set(email, code)

  await sendVerificationEmail(email, code)

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}

export async function PUT(req: NextRequest) {
  const { email, code } = await req.json()

  if (codes.get(email) !== code) {
    return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 400 })
  }

  codes.delete(email)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }

  await supabase.from('users').update({
    student_email: email,
    student_email_verified: true,
    tier: 'student',
  }).eq('id', user.id)

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
