/**
 * Guest Session Utilities
 */

import { createGuestSession as dbCreateGuestSession, validateGuestSession } from '@/lib/database/queries'

const GUEST_KEYS = {
  ID: 'rando-guest-id',
  TOKEN: 'rando-guest-token',
  NAME: 'rando-guest-name',
  EXPIRES: 'rando-guest-expires',
}

export async function createAndStoreGuestSession() {
  const session = await dbCreateGuestSession({
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  })

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_KEYS.ID, session.guest_id)
    localStorage.setItem(GUEST_KEYS.TOKEN, session.session_token)
    localStorage.setItem(GUEST_KEYS.NAME, session.display_name)
    localStorage.setItem(GUEST_KEYS.EXPIRES, session.expires_at)
  }

  return session
}

export function getStoredGuestSession() {
  if (typeof window === 'undefined') return null

  const id = localStorage.getItem(GUEST_KEYS.ID)
  const token = localStorage.getItem(GUEST_KEYS.TOKEN)
  const name = localStorage.getItem(GUEST_KEYS.NAME)
  const expires = localStorage.getItem(GUEST_KEYS.EXPIRES)

  if (!id || !token || !name || !expires) return null

  return { id, token, name, expires }
}

export function clearGuestSession() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(GUEST_KEYS.ID)
  localStorage.removeItem(GUEST_KEYS.TOKEN)
  localStorage.removeItem(GUEST_KEYS.NAME)
  localStorage.removeItem(GUEST_KEYS.EXPIRES)
}
