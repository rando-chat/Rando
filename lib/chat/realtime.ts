import { supabase } from '@/lib/supabase/client'

export function createChatChannel(sessionId: string) {
  return supabase.channel(`chat:${sessionId}`)
}

export function subscribeToChatMessages(sessionId: string, callback: (msg: any) => void) {
  return supabase
    .channel(`chat:${sessionId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe()
}
