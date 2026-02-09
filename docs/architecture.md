# System Architecture Documentation

## Overview

Rando Chat is a full-stack enterprise chat platform built with Next.js, Supabase, and Stripe. This document describes the complete system architecture.

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks + Supabase Realtime
- **Charts:** Recharts
- **Testing:** Jest + React Testing Library + Playwright

### Backend
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage
- **Functions:** PostgreSQL Functions + Next.js API Routes

### Payments
- **Primary:** Stripe
- **Alternative:** LemonSqueezy
- **Features:** Subscriptions, Webhooks, Customer Portal

### Infrastructure
- **Hosting:** Vercel
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge Network
- **DNS:** Vercel Domains

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│  (Web Browser, Mobile Browser, Progressive Web App)         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                       │
│  - SSL Termination                                           │
│  - DDoS Protection                                           │
│  - Global CDN                                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS APPLICATION                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   API Routes │  │  Middleware  │     │
│  │  Components  │  │   /api/*     │  │   Auth Guard │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐  ┌────────┐  ┌────────┐
│ Supabase│  │ Stripe │  │SendGrid│
│         │  │        │  │        │
│ ┌─────┐ │  │ ┌────┐ │  │ ┌────┐ │
│ │ DB  │ │  │ │Pay │ │  │ │Mail│ │
│ └─────┘ │  │ └────┘ │  │ └────┘ │
│ ┌─────┐ │  │ ┌────┐ │  └────────┘
│ │Auth │ │  │ │Sub │ │
│ └─────┘ │  │ └────┘ │
│ ┌─────┐ │  │ ┌────┐ │
│ │Real │ │  │ │Hook│ │
│ └─────┘ │  │ └────┘ │
│ ┌─────┐ │  └────────┘
│ │Stor │ │
│ └─────┘ │
└─────────┘
```

---

## Database Schema

### Core Tables

#### users
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- display_name (VARCHAR(32))
- tier (ENUM: free/student/premium/admin)
- interests (TEXT[])
- bio (VARCHAR(500))
- avatar_url (TEXT)
- location (TEXT)
- age (INT)
- match_count (INT)
- report_count (INT)
- total_chat_time (INTERVAL)
- is_banned (BOOLEAN)
- ban_reason (TEXT)
- student_email (TEXT)
- student_email_verified (BOOLEAN)
- email_verified (BOOLEAN)
- last_seen_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### chat_sessions
```sql
- id (UUID, PK)
- user1_id (UUID, FK → users)
- user2_id (UUID, FK → users)
- status (ENUM: active/ended)
- shared_interests (TEXT[])
- started_at (TIMESTAMP)
- ended_at (TIMESTAMP)
- total_duration (INTERVAL)
```

#### messages
```sql
- id (UUID, PK)
- session_id (UUID, FK → chat_sessions)
- sender_id (UUID, FK → users)
- content (TEXT)
- is_safe (BOOLEAN)
- moderation_score (DECIMAL)
- flagged_reason (TEXT)
- created_at (TIMESTAMP)
```

#### subscriptions
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- provider (ENUM: stripe/lemonsqueezy)
- provider_subscription_id (TEXT)
- tier (ENUM: student/premium)
- status (ENUM: active/canceled/past_due)
- current_period_end (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### reports
```sql
- id (UUID, PK)
- reporter_id (UUID, FK → users)
- reported_user_id (UUID, FK → users)
- session_id (UUID, FK → chat_sessions)
- category (TEXT)
- reason (TEXT)
- evidence (TEXT)
- status (ENUM: pending/resolved/dismissed)
- action_taken (TEXT)
- reviewed_by (UUID, FK → users)
- created_at (TIMESTAMP)
- resolved_at (TIMESTAMP)
```

### Supporting Tables

- **matchmaking_queue**: Active matching queue
- **analytics_events**: Event tracking
- **audit_log**: Admin action logging
- **moderation_rules**: Content moderation rules
- **banned_patterns**: Blocked content patterns
- **rate_limits**: Request rate limiting

---

## Row Level Security (RLS)

All tables enforce RLS policies:

```sql
-- Users can only read/update their own data
CREATE POLICY users_select ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update ON users
  FOR UPDATE USING (auth.uid() = id);

-- Messages viewable only by session participants
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE id = session_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- Admin full access
CREATE POLICY admin_all ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND tier = 'admin'
    )
  );
```

---

## Database Functions

### Core Functions

#### match_users_v2()
Smart matchmaking algorithm:
1. Validates user in queue
2. Calculates compatibility scores:
   - Shared interests (0-10 points)
   - Tier priority (premium > student > free)
   - Wait time bonus
3. Filters by age preferences
4. Returns best match
5. Creates chat session
6. Removes users from queue

#### check_content_advanced()
Content moderation:
1. Checks against banned patterns
2. Calculates safety score (0.0-1.0)
3. Flags if score < 0.6
4. Blocks if score < 0.3
5. Returns results to client

#### handle_user_report()
Report processing:
1. Validates reporter (30-min cooldown)
2. Validates reported user exists
3. Creates report record
4. Increments report_count
5. Auto-bans at 3+ reports
6. Logs to audit trail

### Triggers

#### sanitize_message_content()
Fires on message INSERT:
1. Calls check_content_advanced()
2. Updates is_safe, moderation_score
3. Sets flagged_reason if unsafe

#### auto_ban_trigger()
Fires when report_count >= 3:
1. Sets is_banned = true
2. Sets ban_reason
3. Ends active chat sessions
4. Logs to audit trail

---

## Real-time Subscriptions

### Messages
```typescript
supabase
  .channel(`chat:${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `session_id=eq.${sessionId}`
  }, handleNewMessage)
  .subscribe()
```

### Presence (Typing)
```typescript
channel.track({
  user_id: userId,
  typing: true,
  timestamp: Date.now()
})
```

### Queue Updates
```typescript
supabase
  .channel('queue')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'matchmaking_queue'
  }, handleMatchFound)
  .subscribe()
```

---

## Authentication Flow

### User Registration
```
1. User submits email/password
2. Supabase creates auth user
3. Trigger creates users table record
4. Sends verification email
5. User clicks link → email_verified = true
6. Redirects to matchmaking
```

### Guest Session
```
1. Generate UUID guest ID
2. Store in localStorage
3. Set 24-hour expiry
4. Create temp user record
5. Allow chat access
6. Expire after 24h
```

### OAuth (Optional)
```
1. User clicks OAuth button
2. Redirects to provider
3. Provider authenticates
4. Callback to /api/auth/callback
5. Supabase creates user
6. Redirects to app
```

---

## Payment Processing

### Stripe Checkout Flow
```
1. User clicks "Upgrade"
2. Next.js API creates checkout session
3. Redirects to Stripe
4. User completes payment
5. Stripe sends webhook
6. Webhook handler:
   - Verifies signature
   - Updates users.tier
   - Creates subscription record
7. Redirects to success page
```

### Webhook Security
```typescript
const signature = req.headers['stripe-signature']
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)
// Webhook verified!
```

---

## Matching Algorithm

### Scoring System

```typescript
score = (
  sharedInterests * 10 +      // 0-200 points
  tierBonus +                   // 0-100 points
  waitTimeBonus                 // 0-50 points
)

tierBonus = {
  premium: 100,
  student: 50,
  free: 0,
  admin: 0
}

waitTimeBonus = min(waitMinutes, 50)
```

### Matching Process
1. User joins queue with preferences
2. Queue pings every 10 seconds
3. match_users_v2() called every 3 seconds
4. Calculates scores for all candidates
5. Returns highest score match
6. Creates session
7. Notifies both users

---

## Content Moderation

### Multi-Layer Approach

1. **Client-Side Pre-Check:**
   - Debounced validation (500ms)
   - Warns if score < 0.6
   - Shows safety indicator

2. **Server-Side Validation:**
   - check_content_advanced() on send
   - Pattern matching
   - Profanity filtering
   - Contextual analysis

3. **Post-Send Sanitization:**
   - sanitize_message_content() trigger
   - Updates safety fields
   - Flags for review if needed

4. **Manual Review:**
   - Admin reviews flagged messages
   - Can ban users
   - Updates moderation rules

---

## Rate Limiting

Implemented at multiple levels:

### Database Level
```sql
-- rate_limits table tracks:
- user_id
- action_type
- count
- window_start
- window_end
```

### Application Level
```typescript
// middleware.ts
const rateLimit = new Map()

function checkRateLimit(userId, action, limit, window) {
  const key = `${userId}:${action}`
  const now = Date.now()
  const requests = rateLimit.get(key) || []
  
  // Filter requests in current window
  const recent = requests.filter(t => now - t < window)
  
  if (recent.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  recent.push(now)
  rateLimit.set(key, recent)
}
```

### Limits
- Messages: 10/minute
- Reports: 1/30 minutes
- Match requests: 5/minute
- API calls: 100/minute

---

## Caching Strategy

### Browser Cache
- Static assets: 1 year
- API responses: No cache
- Images: 30 days

### CDN Cache (Vercel Edge)
- Pages: Revalidate on demand
- API routes: No cache
- Static files: Infinite

### Database Cache
- Connection pooling (Supabase)
- Query caching: Disabled for realtime
- Prepared statements: Enabled

---

## Error Handling

### Client-Side
```typescript
try {
  await sendMessage(data)
} catch (error) {
  if (error.code === '23505') {
    // Duplicate key
    toast.error('Message already sent')
  } else if (error.message.includes('RLS')) {
    // Permission denied
    toast.error('Not authorized')
  } else {
    // Generic error
    toast.error('Failed to send message')
  }
  
  // Log to Sentry
  Sentry.captureException(error)
}
```

### Server-Side
```typescript
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    // Process...
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    
    // Log to monitoring
    await logError(error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Monitoring & Observability

### Metrics Tracked
- User registrations per day
- Daily active users (DAU)
- Monthly active users (MAU)
- Match success rate
- Average session duration
- Message volume
- Payment conversion rate
- Error rate
- API latency

### Logging
- Application logs: Vercel
- Database logs: Supabase
- Error tracking: Sentry
- Analytics: Custom + Google Analytics

### Alerts
- Error rate > 5%
- Match rate < 50%
- Churn rate > 10%
- API latency > 2s
- Database CPU > 80%

---

## Security

### Implemented Measures

1. **Authentication:**
   - Supabase Auth (JWT)
   - Session management
   - CSRF protection

2. **Authorization:**
   - Row Level Security
   - Tier-based access
   - Admin-only routes

3. **Data Protection:**
   - HTTPS only
   - Encrypted at rest (Supabase)
   - Encrypted in transit (SSL)
   - No PII in logs

4. **Input Validation:**
   - Zod schemas
   - SQL injection prevention (parameterized queries)
   - XSS prevention (React escaping)
   - Rate limiting

5. **Content Security:**
   - CSP headers
   - Same-origin policy
   - Subresource integrity

---

## Performance

### Optimization Techniques

1. **Code Splitting:**
   - Route-based splitting
   - Dynamic imports
   - Lazy loading

2. **Image Optimization:**
   - Next.js Image component
   - WebP format
   - Lazy loading

3. **Database:**
   - Indexes on foreign keys
   - Query optimization
   - Connection pooling

4. **Caching:**
   - Browser cache
   - CDN cache
   - API response cache (where applicable)

5. **Bundle Size:**
   - Tree shaking
   - Minification
   - Compression (gzip/brotli)

---

## Scalability

### Current Capacity
- **Users:** 10,000 concurrent
- **Messages:** 1,000/second
- **Database:** 100GB
- **Bandwidth:** 1TB/month

### Scaling Strategy

**Horizontal Scaling:**
- Vercel auto-scales
- Supabase connection pooling
- CDN edge locations

**Vertical Scaling:**
- Upgrade Supabase plan
- Increase database resources
- More Vercel concurrency

**Database Scaling:**
- Read replicas (Supabase Pro+)
- Partitioning (messages by date)
- Archiving old data

---

## Disaster Recovery

### Backup Strategy
- **Database:** Daily automated backups (30-day retention)
- **Code:** Git repository on GitHub
- **Assets:** Supabase Storage (versioned)

### Recovery Procedures
- **Database failure:** Restore from latest backup (<1 hour)
- **Code deployment issue:** Rollback to previous version (<5 minutes)
- **Total failure:** Rebuild from backups (<24 hours)

### RPO/RTO
- **RPO (Recovery Point Objective):** 24 hours
- **RTO (Recovery Time Objective):** 1 hour

---

## Future Enhancements

### Planned Features
- Mobile apps (iOS/Android)
- Video/voice chat
- Group chats
- AI-powered matching
- Blockchain verification
- Advanced analytics

### Technical Debt
- Migrate to server components fully
- Add comprehensive E2E tests
- Implement service workers (PWA)
- Add GraphQL layer
- Improve type safety

---

## References

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- React Docs: https://react.dev
