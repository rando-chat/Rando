/**
 * Session Management Utilities
 */

import { supabase } from '@/lib/supabase/client'

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return session
}

export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession()
  return session
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function isSessionValid(session: any): boolean {
  if (!session) return false
  const expiresAt = new Date(session.expires_at * 1000)
  return expiresAt > new Date()
}
