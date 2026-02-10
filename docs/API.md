# Rando Chat API Documentation

## Overview

This document describes all API endpoints and database functions available in the Rando Chat platform.

## Authentication

All API routes require authentication via Supabase Auth. Include the session token in requests.

```typescript
const { data: { session } } = await supabase.auth.getSession()
// Use session.access_token in Authorization header
```

---

## API Routes

### Authentication

#### POST /api/auth/callback
Handles OAuth callback from Supabase Auth.

**Response:**
- Redirects to home page with session

---

### Webhooks

#### POST /api/webhooks/stripe
Handles Stripe webhook events.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Events Handled:**
- `checkout.session.completed`: Updates user tier, creates subscription
- `customer.subscription.deleted`: Cancels subscription

**Example Payload:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "metadata": {
        "user_id": "uuid",
        "tier": "premium"
      }
    }
  }
}
```

#### POST /api/webhooks/lemon
Handles LemonSqueezy webhook events.

**Headers:**
- `x-signature`: HMAC signature for verification

**Events Handled:**
- `order_created`: Creates subscription
- `subscription_cancelled`: Cancels subscription

---

### Student Verification

#### POST /api/verify/student
Sends verification code to student email.

**Request Body:**
```json
{
  "email": "student@university.edu"
}
```

**Response:**
```json
{
  "success": true
}
```

#### PUT /api/verify/student
Verifies student email with code.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Database Functions

### User Management

#### getUserProfile(userId: string)
Fetches complete user profile.

**Returns:**
```typescript
{
  id: string
  display_name: string
  tier: 'free' | 'student' | 'premium' | 'admin'
  interests: string[]
  bio: string | null
  avatar_url: string | null
  match_count: number
  report_count: number
  is_banned: boolean
}
```

#### updateUserProfile(userId: string, updates: Partial<User>)
Updates user profile fields.

**Parameters:**
```typescript
{
  display_name?: string  // 1-32 chars
  bio?: string          // max 500 chars
  interests?: string[]  // max 20 items
  location?: string
  age?: number         // 13-120
  avatar_url?: string
}
```

---

### Chat Functions

#### match_users_v2(p_user_id: UUID, p_interests: TEXT[], p_min_age?: INT, p_max_age?: INT)
Finds match for user in queue.

**Parameters:**
- `p_user_id`: User requesting match
- `p_interests`: User's interests for matching
- `p_min_age`: Minimum age preference (optional)
- `p_max_age`: Maximum age preference (optional)

**Returns:**
```typescript
{
  session_id: UUID
  partner_id: UUID
  partner_name: string
  shared_interests: string[]
}
```

**Matching Algorithm:**
1. Tier Priority: premium > student > free
2. Interest Overlap: More shared interests = higher score
3. Wait Time: Longer wait = higher priority
4. Age Range: Respects preferences

#### getChatMessages(sessionId: string, limit?: number)
Retrieves messages for chat session.

**Returns:**
```typescript
Array<{
  id: UUID
  content: string
  sender_id: UUID
  is_safe: boolean
  moderation_score: number
  flagged_reason: string | null
  created_at: timestamp
}>
```

#### sendMessage(data: MessageData)
Creates new message (auto-sanitized via trigger).

**Parameters:**
```typescript
{
  session_id: UUID
  sender_id: UUID
  content: string  // max 2000 chars
}
```

#### createChatSession(user1Id: string, user2Id: string)
Creates new chat session.

**Returns:**
```typescript
{
  id: UUID
  user1_id: UUID
  user2_id: UUID
  status: 'active'
  started_at: timestamp
}
```

#### endChatSession(sessionId: string)
Ends active chat session.

---

### Content Moderation

#### check_content_advanced(p_content: TEXT)
Validates message content before sending.

**Returns:**
```typescript
{
  is_safe: boolean
  safety_score: number    // 0.0-1.0
  flagged_reason: string | null
}
```

**Safety Thresholds:**
- `< 0.3`: Blocked (very unsafe)
- `0.3-0.6`: Flagged (potentially unsafe)
- `> 0.6`: Safe

#### handle_user_report(p_reporter_id: UUID, p_reported_user_id: UUID, p_category: TEXT, p_reason: TEXT)
Submits user report.

**Categories:**
- harassment
- hate_speech
- spam
- inappropriate_content
- threats
- impersonation
- underage
- other

**Cooldown:** 30 minutes between reports

**Auto-Ban:** User banned at 3+ reports

---

### Analytics

#### trackEvent(eventType: string, userId: string | null, properties?: object)
Tracks analytics event.

**Event Types:**
- `user_signup`
- `user_login`
- `match_found`
- `chat_started`
- `chat_ended`
- `message_sent`
- `report_submitted`
- `subscription_created`
- `subscription_cancelled`

---

### Payments

#### createCheckoutSession(userId: string, tier: 'student' | 'premium')
Creates Stripe checkout session.

**Returns:**
```typescript
{
  url: string  // Stripe checkout URL
}
```

#### createPortalSession(userId: string)
Creates Stripe billing portal session.

**Returns:**
```typescript
{
  url: string  // Stripe portal URL
}
```

---

## Real-time Subscriptions

### Messages
Subscribe to new messages in a session.

```typescript
supabase
  .channel(`chat:${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    // Handle new message
  })
  .subscribe()
```

### Typing Indicators
Track typing status using presence.

```typescript
const channel = supabase.channel(`chat:${sessionId}`)

// Send typing
await channel.track({ typing: true, userId })

// Listen for typing
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  // Check who's typing
})
```

### Queue Updates
Listen for match notifications.

```typescript
supabase
  .channel('matchmaking')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'matchmaking_queue',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    if (payload.new.matched_with) {
      // Match found!
    }
  })
  .subscribe()
```

---

## Rate Limits

- **Messages:** 10 per minute per user
- **Reports:** 1 per 30 minutes per user
- **Match Requests:** 5 per minute per user
- **API Calls:** 100 per minute per IP

---

## Error Codes

- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - No valid session
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Contact support

---

## Security

All endpoints enforce:
- Row Level Security (RLS) policies
- Content sanitization
- Input validation
- Rate limiting
- CSRF protection

---

## Support

For API issues:
- Email: support@randochat.com
- Docs: https://docs.randochat.com
- Status: https://status.randochat.com
