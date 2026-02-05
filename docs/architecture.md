## Overview

RANDO is a 100% free random chat platform built with modern serverless architecture. The entire platform operates without monthly costs by leveraging free tiers of various services.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vercel** - Hosting & Edge Functions (Free tier)

### Backend
- **Supabase** - Database, Auth, Realtime, Storage (Free tier)
- **PostgreSQL** - Relational database
- **WebSockets** - Real-time chat via Supabase Realtime

### External Services
- **Resend** - Email delivery (3k emails/month free)
- **Lemon Squeezy** - Payments (no monthly fee, 3.5% per transaction)
- **Google Analytics 4** - Analytics (Free)
- **Cloudflare** - DNS & SSL (Free)

## Architecture Diagram

```

┌─────────────────────────────────────────────────────────────┐
│                     User Browser                            │
└─────────────────┬───────────────────────────────────────────┘
│ HTTPS
┌─────────────────▼───────────────────────────────────────────┐
│                    Vercel (Edge Network)                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               React App (Static)                    │  │
│  └─────────────────┬───────────────────────────────────┘  │
│                    │ API Calls                           │
│  ┌─────────────────▼───────────────────────────────────┐  │
│  │               Edge Functions                        │  │
│  │  • Email sending (Resend)                          │  │
│  │  • Payment webhooks (Lemon Squeezy)                │  │
│  │  • Content moderation                              │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
│ HTTPS
┌─────────────────▼───────────────────────────────────────────┐
│                    Supabase                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               PostgreSQL Database                   │  │
│  │  • Users, messages, sessions                       │  │
│  │  • Real-time with row-level security               │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               Authentication                        │  │
│  │  • Email/password auth                             │  │
│  │  • JWT tokens                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               Storage                               │  │
│  │  • Image uploads (5MB max)                         │  │
│  │  • Secure file storage                             │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │               Realtime                              │  │
│  │  • WebSocket connections                           │  │
│  │  • Instant message delivery                        │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘

```

## Database Schema

### Core Tables

1. **users** - User profiles (extends Supabase Auth)
2. **chat_sessions** - Active chat sessions
3. **messages** - Chat messages with real-time updates
4. **matchmaking_queue** - Users waiting for matches
5. **reports** - User reports for moderation
6. **email_verifications** - Email verification codes
7. **checkout_sessions** - Payment sessions

### Security

- **Row Level Security (RLS)** - Data access control at database level
- **JWT Authentication** - Secure API access
- **Input Validation** - Both client and server side
- **Content Moderation** - Automatic link blocking and profanity filter

## Real-time System

### WebSocket Implementation

1. **Connection** - Users connect via Supabase Realtime
2. **Channels** - Each chat session has its own channel
3. **Broadcast** - Messages broadcast to session participants
4. **Presence** - Track online users in real-time

### Message Flow

```

User A → Send Message → Supabase Insert → Realtime Broadcast → User B

```

## Cost Structure

### Monthly Costs: $0

| Service | Free Tier | Usage |
|---------|-----------|-------|
| Supabase | 50k MAU, 500MB DB | Database, Auth, Realtime, Storage |
| Vercel | 100GB bandwidth | Hosting & Edge Functions |
| Resend | 3k emails/month | Email verification |
| Lemon Squeezy | No monthly fee | Payment processing (3.5% per transaction) |
| Cloudflare | Free SSL/CDN | Domain & security |
| **Total** | **$0/month** | Scalable to 50k users |

### When to Upgrade

1. **> 50k Monthly Active Users** - Upgrade Supabase ($25/month)
2. **> 3k Emails/month** - Upgrade Resend ($20/month)
3. **> 100GB Bandwidth** - Upgrade Vercel ($20/month)
4. **> 500MB Database** - Upgrade Supabase storage

## Scalability

### Horizontal Scaling

1. **Database** - Supabase automatically scales
2. **Realtime** - WebSocket connections distributed
3. **Storage** - CDN-backed file storage
4. **Edge Functions** - Distributed globally

### Performance Optimizations

1. **Database Indexes** - Optimized queries
2. **Connection Pooling** - Efficient database connections
3. **CDN Caching** - Static assets cached globally
4. **Image Optimization** - Automatic resizing and compression

## Security Features

### Data Protection

1. **Encryption at rest** - Database encryption
2. **Encryption in transit** - TLS 1.3 everywhere
3. **Secure authentication** - JWT with short expiry
4. **Input sanitization** - Prevent SQL injection and XSS

### User Safety

1. **Link blocking** - All URLs automatically blocked
2. **Content moderation** - Profanity and PII detection
3. **User reporting** - 3 reports = auto-ban
4. **Age verification** - 18+ requirement

## Deployment

### One-Command Deployment

```bash
./scripts/deploy.sh
```

Manual Steps

1. Create Supabase project
2. Deploy to Vercel
3. Configure domain in Cloudflare
4. Set up Lemon Squeezy products
5. Configure Resend domain
6. Add environment variables

Monitoring

Built-in Analytics

1. Supabase Dashboard - Database performance
2. Vercel Analytics - Web vitals and performance
3. Google Analytics - User behavior
4. Custom Events - Track key user actions

Error Tracking

1. Console errors - Browser DevTools
2. Edge Function logs - Vercel dashboard
3. Database logs - Supabase dashboard
4. Email alerts - Critical errors notification

Development

Local Development

```bash
./scripts/setup.sh
```

Environment Variables

See .env.example for required variables

Database Migrations

```bash
npx supabase db reset  # Reset and seed
npx supabase db push   # Push migrations
```

Conclusion

RANDO demonstrates that a full-featured chat platform can be built and operated completely free using modern serverless architecture. The platform can scale to 50k users without any monthly costs while maintaining enterprise-grade security and performance.
