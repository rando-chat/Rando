# RANDO CHAT

> **Anonymous real-time chat. Connect with strangers. No profiles. No history. Just conversation.**

🌐 **Live:** [rando-chat.vercel.app](https://rando-chat.vercel.app)

---

## What It Is

Rando Chat is a production-grade anonymous chat platform where users are matched with strangers for real-time conversations. Built for genuine human connection without the baggage of social media — no followers, no feeds, no permanence.

- **Guest access** — start chatting in seconds, no account required
- **Smart matchmaking** — matched by shared interests and compatibility
- **Tiered membership** — Free, Student, and Premium plans via Stripe
- **Enterprise moderation** — AI-powered content safety, report system, admin dashboard
- **Real-time everything** — live typing indicators, instant message delivery via Supabase

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth (PKCE flow) |
| Payments | Stripe (subscriptions) |
| Email | Resend |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Analytics | Google Analytics + Sentry |
| Content Safety | Perspective API |

---

## Features

### For Users
- **Guest Sessions** — chat anonymously without registering, session persists in browser
- **Matchmaking Queue** — join the queue and get matched in real-time based on interests
- **Live Chat** — real-time messaging with typing indicators, message delivery status
- **Chat History** — registered users can review past conversations
- **Profile** — display name, bio, interests, avatar upload
- **Safety Tools** — report users, block, end chat instantly
- **Tier Upgrade** — Student ($4.99/mo) and Premium ($9.99/mo) plans via Stripe checkout

### For Admins
- **Dashboard** — live metrics, active users, sessions, revenue overview
- **User Management** — search users, view profiles, change tiers, ban/unban
- **Moderation Queue** — review flagged messages and pending reports
- **Content Review** — AI safety scores on flagged content (0.0–1.0 scale)
- **Audit Log** — full record of all admin actions
- **System Health** — real-time database and service monitoring

---

## Project Structure

```
/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Login, register, password reset
│   ├── admin/                  # Admin dashboard, users, moderation
│   ├── api/                    # API routes (auth callback, webhooks, verification)
│   ├── chat/[id]/              # Active chat session
│   ├── history/                # Chat history list + detail
│   ├── matchmaking/            # Matchmaking queue
│   ├── payments/               # Stripe checkout success/cancel
│   └── settings/               # User settings (profile, notifications, privacy, etc.)
│
├── components/                 # React components
│   ├── admin/                  # Dashboard, stats, user/moderation panels
│   ├── analytics/              # Charts and metrics components
│   ├── auth/                   # AuthProvider, AuthGuard
│   ├── chat/                   # ChatInterface, MessageBubble, MessageInput, etc.
│   ├── matchmaking/            # Queue status, match found, preferences
│   ├── payments/               # Checkout form, subscription status, tier cards
│   ├── profile/                # Profile editor, stats, tier display
│   └── moderation/             # Report modal, evidence collector
│
├── hooks/                      # Custom React hooks
│   ├── useChat.ts              # Chat session management
│   ├── useMatchmaking.ts       # Queue and matching logic
│   ├── useRealtime.ts          # Supabase realtime subscriptions
│   ├── useMessages.ts          # Message fetching and sending
│   └── useAuth.ts              # Auth state (via AuthProvider)
│
├── lib/                        # Shared utilities and services
│   ├── supabase/               # Client, server client, middleware
│   ├── database/               # Query functions, triggers
│   ├── payments/               # Stripe integration, student verification
│   ├── auth/                   # Session helpers, guest auth
│   ├── analytics/              # Event tracking
│   ├── security/               # Rate limiting, CSP, sanitization
│   └── moderation/             # Report handling
│
└── tests/                      # Test suite
    ├── unit/                   # Component and hook tests
    ├── integration/            # Database integration tests
    └── e2e/                    # End-to-end chat flow tests
```

---

## Database Schema

12 tables in Supabase PostgreSQL:

| Table | Purpose |
|-------|---------|
| `users` | Registered user profiles, tiers, ban status |
| `guest_sessions` | Anonymous session tokens with expiry |
| `chat_sessions` | Active and historical chat pairs |
| `messages` | Chat messages with safety scores |
| `matchmaking_queue` | Users waiting to be matched |
| `reports` | User reports with evidence |
| `subscriptions` | Stripe subscription records |
| `analytics_events` | Usage event tracking |
| `audit_log` | Admin action history |
| `moderation_rules` | Configurable content rules |
| `banned_patterns` | Regex patterns for auto-moderation |
| `rate_limits` | Per-user rate limiting records |

**Security:** Row Level Security (RLS) enabled on all tables. Content sanitized on write via PostgreSQL triggers.

---

## Environment Variables

Create a `.env.local` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=hello@yourdomain.com

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
PERSPECTIVE_API_KEY=your-perspective-key

# App
NEXT_PUBLIC_APP_URL=https://your-deployment.vercel.app
NEXT_PUBLIC_APP_NAME=RANDO CHAT
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- A Stripe account (test mode is fine)

### Local Development

```bash
# Clone the repository
git clone https://github.com/Newton-ait/Rando.git
cd Rando

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Deployment

The project is configured for zero-config deployment on Vercel:

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy — Vercel handles the rest

---

## Creating an Admin Account

1. Register normally at `/register`
2. Run this in the Supabase SQL editor:

```sql
UPDATE users SET tier = 'admin' WHERE email = 'your@email.com';
```

3. Access the admin dashboard at `/admin/dashboard`

---

## Stripe Setup

1. Create two products in your Stripe dashboard:
   - **Student** — $4.99/month recurring
   - **Premium** — $9.99/month recurring

2. Add the price IDs as environment variables:
   ```bash
   STRIPE_STUDENT_PRICE_ID=price_...
   STRIPE_PREMIUM_PRICE_ID=price_...
   ```

3. Set up a webhook endpoint pointing to:
   ```
   https://your-domain.vercel.app/api/webhooks/stripe
   ```

---

## Rate Limits

| Action | Limit |
|--------|-------|
| Messages | 10 per minute |
| Reports | 1 per 30 minutes |
| Matchmaking joins | 5 per minute |
| Profile updates | 10 per hour |

---

## Content Safety

Messages are scored 0.0–1.0 by the Perspective API before storage. Messages scoring above the threshold are flagged, stored with `is_safe: false`, and surfaced in the admin content review queue. Auto-ban triggers fire on repeated violations.

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest unit tests
npm run test:watch   # Watch mode
```

---

## License

Private — All rights reserved. © 2025 D3sk Developers Platform.

---

*Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), [Stripe](https://stripe.com), and [Vercel](https://vercel.com).*

