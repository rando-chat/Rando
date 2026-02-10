import { supabase } from '@/lib/supabase/client'

export async function trackEvent(
  eventType: string,
  userId: string | null,
  properties?: Record<string, any>
) {
  await supabase.from('analytics_events').insert({
    event_type: eventType,
    user_id: userId,
    properties: properties || {},
  })
}

export const AnalyticsEvents = {
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  MATCH_FOUND: 'match_found',
  CHAT_STARTED: 'chat_started',
  CHAT_ENDED: 'chat_ended',
  MESSAGE_SENT: 'message_sent',
  REPORT_SUBMITTED: 'report_submitted',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
} as const
