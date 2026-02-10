import { supabase } from '@/lib/supabase/client'
export async function sendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  return !error
}
