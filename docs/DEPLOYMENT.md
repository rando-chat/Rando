# Production Deployment Guide

Complete guide to deploying Rando Chat to production.

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Vercel account (or alternative hosting)
- Stripe account
- Domain name (optional)

---

## 1. Supabase Setup

### Create Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter details:
   - Name: `rando-chat-production`
   - Database Password: Generate strong password
   - Region: Choose closest to users
4. Wait for project to initialize (~2 minutes)

### Database Schema

1. Go to SQL Editor
2. Run the complete SQL schema from `database/schema.sql`
3. Verify all tables created:
   - users
   - chat_sessions
   - messages
   - matchmaking_queue
   - reports
   - subscriptions
   - analytics_events
   - audit_log
   - moderation_rules
   - banned_patterns
   - rate_limits

### Enable Realtime

1. Go to Database → Replication
2. Enable replication for:
   - `messages`
   - `matchmaking_queue`
   - `analytics_events`
3. Publish changes

### Storage Buckets

1. Go to Storage
2. Create buckets:
   - `avatars` (public)
   - `uploads` (private)
3. Set RLS policies for avatar uploads

### Auth Configuration

1. Go to Authentication → Providers
2. Enable Email provider
3. (Optional) Enable OAuth:
   - Google
   - GitHub
   - Discord
4. Configure email templates
5. Set site URL: `https://yourdomain.com`
6. Add redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (dev)

---

## 2. Stripe Setup

### Create Products

1. Go to https://dashboard.stripe.com/products
2. Create products:

**Student Plan:**
- Name: `Rando Chat Student`
- Price: `$4.99/month`
- Recurring: Monthly
- Save Price ID: `price_...`

**Premium Plan:**
- Name: `Rando Chat Premium`
- Price: `$9.99/month`
- Recurring: Monthly
- Save Price ID: `price_...`

### Configure Webhooks

1. Go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Save webhook signing secret: `whsec_...`

### Customer Portal

1. Go to Settings → Billing → Customer Portal
2. Enable portal
3. Configure allowed actions:
   - Update payment method
   - View invoices
   - Cancel subscription
4. Set business information

---

## 3. Environment Variables

Create `.env.production`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STUDENT_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# LemonSqueezy (optional)
LEMONSQUEEZY_WEBHOOK_SECRET=...

# App
NEXT_PUBLIC_URL=https://yourdomain.com
NODE_ENV=production

# Email (SendGrid/Resend)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-...
```

---

## 4. Vercel Deployment

### Initial Setup

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login:
```bash
vercel login
```

3. Link project:
```bash
vercel link
```

### Configure Project

1. Go to Vercel dashboard
2. Import GitHub repository
3. Configure:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Set Environment Variables

1. Go to Settings → Environment Variables
2. Add all variables from `.env.production`
3. Set for: Production, Preview, Development

### Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

---

## 5. Domain Setup

### Add Custom Domain

1. Go to Vercel → Settings → Domains
2. Add domain: `yourdomain.com`
3. Configure DNS:

```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

4. Wait for DNS propagation (~24 hours)
5. SSL certificate auto-generated

### Supabase URL Update

1. Go to Supabase → Authentication → URL Configuration
2. Update site URL: `https://yourdomain.com`
3. Add redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://www.yourdomain.com/auth/callback`

---

## 6. Post-Deployment Checks

### Verify Functionality

- [ ] Homepage loads
- [ ] User registration works
- [ ] Email verification sends
- [ ] Guest sessions create
- [ ] Matchmaking queue works
- [ ] Chat messages send/receive
- [ ] Realtime updates work
- [ ] Payment checkout works
- [ ] Webhooks process
- [ ] Student verification works
- [ ] Admin dashboard accessible
- [ ] Analytics load

### Test User Flows

1. **Guest Flow:**
   - Create guest session
   - Join queue
   - Get matched
   - Send messages
   - End chat

2. **User Flow:**
   - Register account
   - Verify email
   - Update profile
   - Join queue
   - Chat
   - View history

3. **Payment Flow:**
   - Click upgrade
   - Complete Stripe checkout
   - Verify tier updated
   - Access premium features

4. **Admin Flow:**
   - Login as admin
   - View dashboard
   - Ban user
   - Review report
   - Check analytics

---

## 7. Monitoring Setup

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

Configure `sentry.client.config.js`:
```javascript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
})
```

### Analytics (Vercel Analytics)

```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Uptime Monitoring

Use services like:
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://pingdom.com
- Better Stack: https://betterstack.com

Monitor:
- Homepage: `https://yourdomain.com`
- API health: `https://yourdomain.com/api/health`
- Supabase: Monitor via Supabase dashboard

---

## 8. Performance Optimization

### Enable Caching

Configure `next.config.js`:
```javascript
module.exports = {
  images: {
    domains: ['supabase.co'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}
```

### Image Optimization

1. Use Next.js Image component
2. Enable Supabase Image Transformation
3. Set CDN caching headers

### Database Optimization

1. Create indexes:
```sql
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_sessions_status ON chat_sessions(status);
```

2. Enable connection pooling (default in Supabase)

---

## 9. Security Hardening

### CSP Headers

Add to `next.config.js`:
```javascript
headers: async () => [{
  source: '/:path*',
  headers: [
    {
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    }
  ]
}]
```

### Rate Limiting

Verify rate limits in database are active:
- 10 messages/minute per user
- 1 report/30 minutes per user
- 5 match requests/minute per user

### Environment Variables

- [ ] Never commit `.env` files
- [ ] Use Vercel environment variables
- [ ] Rotate secrets regularly
- [ ] Use different keys for dev/prod

---

## 10. Backup & Recovery

### Database Backups

1. Go to Supabase → Database → Backups
2. Enable daily backups
3. Retain for 30 days
4. Download manual backup:
```bash
supabase db dump > backup.sql
```

### Code Backups

- Push to GitHub regularly
- Use tags for releases:
```bash
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

---

## 11. Scaling

### Supabase Scaling

Upgrade plan when:
- > 500 concurrent users
- > 1GB database size
- > 50GB bandwidth/month

Go to: Settings → Billing → Upgrade

### Vercel Scaling

Upgrade plan when:
- > 100GB bandwidth
- > 1000 deployments/month
- Need teams features

Auto-scales with traffic.

---

## 12. Troubleshooting

### Deployment Failed

```bash
# Check build logs
vercel logs

# Rebuild locally
npm run build

# Check environment variables
vercel env ls
```

### Database Connection Issues

1. Check Supabase status
2. Verify connection string
3. Check RLS policies
4. Review rate limits

### Stripe Webhooks Not Working

1. Verify webhook URL
2. Check webhook signature
3. Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 13. Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check uptime reports
- Monitor user feedback

**Monthly:**
- Review analytics
- Check security updates
- Update dependencies
- Backup database manually

**Quarterly:**
- Security audit
- Performance review
- Cost optimization
- Feature planning

---

## 14. Rollback Procedure

If critical issue in production:

```bash
# Revert to previous deployment
vercel rollback

# Or deploy specific version
git checkout v1.0.0
vercel --prod
```

---

## Support

For deployment issues:
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- Stripe: https://support.stripe.com

---

## Checklist

Before going live:

- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Realtime enabled
- [ ] Storage buckets created
- [ ] Auth configured
- [ ] Stripe products created
- [ ] Webhooks configured
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] All tests passing
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Documentation complete
- [ ] User flows tested
- [ ] Admin access verified

**You're ready to launch! 🚀**
