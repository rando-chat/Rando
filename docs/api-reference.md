## Overview

RANDO provides a RESTful API via Supabase and custom Edge Functions. All API endpoints require authentication unless specified.

## Base URLs

- **Supabase API**: `https://your-project.supabase.co/rest/v1`
- **Edge Functions**: `https://yourdomain.com/api`
- **WebSocket**: `wss://your-project.supabase.co/realtime/v1`

## Authentication

### JWT Authentication

All Supabase API requests require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

Getting JWT Token

1. Sign in via /auth/v1/token endpoint
2. Token is automatically managed by Supabase client
3. Refresh token automatically when expired

Supabase Tables API

Users Table

Endpoint: /users

Methods:

· GET /users - Get current user profile
· PATCH /users - Update user profile
· GET /users?select=* - Get all users (admin only)

Example Request:

```javascript
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

Chat Sessions Table

Endpoint: /chat_sessions

Methods:

· GET /chat_sessions - Get user's chat sessions
· POST /chat_sessions - Create new session
· PATCH /chat_sessions/:id - Update session (end chat)

Example Request:

```javascript
// Create session
const { data: session } = await supabase
  .from('chat_sessions')
  .insert({
    user1_id: userId,
    user2_id: partnerId,
    session_type: 'text'
  })
  .select()
  .single();
```

Messages Table

Endpoint: /messages

Methods:

· GET /messages?session_id=eq.:sessionId - Get session messages
· POST /messages - Send new message
· Real-time subscription available

Example Request:

```javascript
// Send message
const { data: message } = await supabase
  .from('messages')
  .insert({
    session_id: sessionId,
    sender_id: userId,
    content: 'Hello!',
    content_type: 'text'
  })
  .select()
  .single();

// Subscribe to real-time
const channel = supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => console.log('New message:', payload.new)
  )
  .subscribe();
```

Matchmaking Queue

Endpoint: /matchmaking_queue

Methods:

· POST /matchmaking_queue - Join queue
· DELETE /matchmaking_queue - Leave queue
· GET /matchmaking_queue - View queue (limited)

Example Request:

```javascript
// Join queue
await supabase
  .from('matchmaking_queue')
  .insert({
    user_id: userId,
    tier: userTier,
    interests: ['gaming', 'music'],
    looking_for: 'text'
  });
```

Edge Functions API

Email Verification

Endpoint: POST /api/email/send-verification

Request Body:

```json
{
  "email": "user@example.com",
  "isStudent": false
}
```

Response:

```json
{
  "success": true,
  "code": "123456"
}
```

Endpoint: POST /api/email/send-welcome

Request Body:

```json
{
  "email": "user@example.com",
  "username": "TestUser"
}
```

Response:

```json
{
  "success": true
}
```

Payment Processing

Endpoint: POST /api/payments/create-checkout

Request Body:

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "tier": "premium"
}
```

Response:

```json
{
  "success": true,
  "checkoutId": "rando_uuid_timestamp",
  "url": "https://lemonsqueezy.com/checkout/..."
}
```

Endpoint: POST /api/payments/lemon-webhook

Webhook Events:

· order_created - New order placed
· subscription_created - New subscription
· subscription_updated - Subscription updated
· subscription_cancelled - Subscription cancelled

Content Moderation

Endpoint: POST /api/moderation/check-content

Request Body:

```json
{
  "content": "Hello world!"
}
```

Response:

```json
{
  "flagged": false,
  "details": {
    "links": false,
    "profanity": false,
    "personal_info": false,
    "harassment": false
  },
  "safe": true
}
```

Real-time Events

Message Events

Event: INSERT on messages table

Payload:

```json
{
  "event": "INSERT",
  "schema": "public",
  "table": "messages",
  "new": {
    "id": "uuid",
    "session_id": "uuid",
    "sender_id": "uuid",
    "content": "Hello!",
    "content_type": "text",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

Session Events

Event: UPDATE on chat_sessions table

Payload:

```json
{
  "event": "UPDATE",
  "schema": "public",
  "table": "chat_sessions",
  "new": {
    "id": "uuid",
    "ended_at": "2024-01-01T00:05:00Z"
  },
  "old": {
    "ended_at": null
  }
}
```

Presence Events

Event: presence for online users

Payload:

```json
{
  "event": "sync",
  "state": {
    "user-uuid-1": [{
      "user_id": "uuid",
      "online_at": "2024-01-01T00:00:00Z"
    }]
  }
}
```

Database Functions

Match Users Function

Function: match_users()

Returns: Best match from queue

Usage:

```sql
SELECT * FROM match_users();
```

Response:

```json
{
  "match_user_id": "uuid",
  "match_tier": "premium",
  "match_interests": ["gaming", "music"]
}
```

Cleanup Queue Function

Function: cleanup_old_queue()

Purpose: Remove queue entries older than 5 minutes

Scheduled: Runs every 5 minutes via cron

Error Handling

Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common Error Codes

Code Description HTTP Status
AUTH_REQUIRED Authentication required 401
PERMISSION_DENIED Insufficient permissions 403
NOT_FOUND Resource not found 404
VALIDATION_ERROR Invalid input data 400
RATE_LIMITED Too many requests 429
INTERNAL_ERROR Server error 500

Rate Limiting

· Supabase API: 500 requests per second (free tier)
· Edge Functions: 100k invocations/month (free tier)
· Custom limits: Per-user rate limiting in application logic

WebSocket Connections

Connection URL

```
wss://your-project.supabase.co/realtime/v1/websocket
```

Connection Parameters

```javascript
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

Subscription Management

```javascript
// Subscribe to channel
const channel = supabase.channel('custom-channel');

// Add event listeners
channel
  .on('broadcast', { event: 'test' }, (payload) => {
    console.log('Received:', payload);
  })
  .subscribe();

// Unsubscribe
supabase.removeChannel(channel);
```

Security Headers

All responses include:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

CORS Configuration

Allowed origins:

· Your domain (e.g., https://yourdomain.com)
· Local development (http://localhost:3000)

Testing API

Using curl

```bash
# Get user profile
curl -H "Authorization: Bearer $JWT" \
  "$SUPABASE_URL/rest/v1/users?id=eq.$USER_ID"

# Send test email
curl -X POST "$APP_URL/api/email/send-verification" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Using Postman

1. Import Postman collection from /docs/postman-collection.json
2. Set environment variables
3. Run requests

Monitoring

API Metrics

1. Request Count - Total API calls
2. Error Rate - Percentage of failed requests
3. Response Time - P95 latency
4. Usage by Endpoint - Most used endpoints

Health Checks

Endpoint: GET /health

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "realtime": "healthy",
    "storage": "healthy"
  }
}
```

Versioning

Current API version: v1

Version is included in Supabase URL: /rest/v1/

Deprecation Policy

1. APIs are supported for at least 6 months after deprecation
2. Deprecated endpoints return X-API-Deprecated: true header
3. Migration guides provided for breaking changes

Support

For API issues:

1. Check error logs in Supabase dashboard
2. Review Edge Function logs in Vercel
3. Contact support with error details

---

This API reference covers the main endpoints. For detailed usage, refer to the source code and TypeScript definitions.
