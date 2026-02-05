# RANDO Platform Deployment Guide

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Git** - [Download](https://git-scm.com/)
3. **Supabase Account** - [Sign up](https://supabase.com)
4. **Vercel Account** - [Sign up](https://vercel.com)
5. **Resend Account** - [Sign up](https://resend.com)
6. **Lemon Squeezy Account** - [Sign up](https://lemonsqueezy.com)
7. **Cloudflare Account** - [Sign up](https://cloudflare.com) (optional)

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/rando-supabase.git
cd rando-supabase

# Install dependencies
npm install
```

Step 2: Supabase Setup

2.1 Create Supabase Project

1. Go to Supabase Dashboard
2. Click "New Project"
3. Enter project name: rando-chat
4. Set database password (save this!)
5. Choose region closest to your users
6. Click "Create new project"

2.2 Get API Keys

1. Go to Project Settings → API
2. Copy:
   · Project URL → NEXT_PUBLIC_SUPABASE_URL
   · anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   · service_role key → SUPABASE_SERVICE_ROLE_KEY

2.3 Configure Authentication

1. Go to Authentication → Settings
2. Enable "Email" provider
3. Disable "Confirm email" (we'll handle manually)
4. Set Site URL to your future domain
5. Save changes

2.4 Set Up Storage

1. Go to Storage → Create New Bucket
2. Name: chat-images
3. Enable public access (for image sharing)
4. Set file size limit to 5MB

Step 3: Environment Variables

Create .env file in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=hello@yourdomain.com

# Lemon Squeezy
LEMON_SQUEEZY_API_KEY=ls_sk_xxxxxxxxxxxxxxxxxxxxxxxx
LEMON_STORE_ID=12345
LEMON_PRODUCT_ID=12345

# Domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Google Analytics (optional)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

Step 4: Lemon Squeezy Setup

4.1 Create Products

1. Go to Lemon Squeezy → Products
2. Create two products:
   · Premium: $4.99/month
   · Student: $2.49/month (50% discount)
3. Copy Product IDs for .env file

4.2 Set Up Webhook

1. Go to Settings → Webhooks
2. Add new webhook:
   · URL: https://yourdomain.com/api/payments/lemon-webhook
   · Events: Select all order/subscription events
3. Copy webhook secret

Step 5: Resend Setup

5.1 Verify Domain

1. Go to Resend → Domains
2. Add your domain (e.g., yourdomain.com)
3. Add DNS records as instructed
4. Wait for verification

5.2 Create API Key

1. Go to Resend → API Keys
2. Create new API key
3. Copy to .env as RESEND_API_KEY

Step 6: Database Setup

```bash
# Run the setup script
./scripts/setup.sh

# Or manually:
npx supabase start
npx supabase db reset
```

Step 7: Vercel Deployment

7.1 Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or use the deployment script
./scripts/deploy.sh
```

7.2 Configure Environment in Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables from your .env file
3. Add LEMON_SQUEEZY_WEBHOOK_SECRET with your webhook secret

7.3 Set Up Domain

1. Go to Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

Step 8: Cloudflare Setup (Optional but Recommended)

8.1 Add Domain

1. Go to Cloudflare Dashboard
2. Add your domain
3. Update nameservers as instructed

8.2 Configure SSL

1. Go to SSL/TLS → Overview
2. Set to "Full" (strict)
3. Enable Always Use HTTPS

8.3 Performance Settings

1. Go to Speed → Optimization
2. Enable:
   · Auto Minify (JS, CSS, HTML)
   · Brotli Compression
   · Rocket Loader

Step 9: Testing

9.1 Test Registration

1. Visit your deployed site
2. Create a new account
3. Verify email works
4. Check user appears in Supabase

9.2 Test Chat

1. Login with two different accounts
2. Start matchmaking
3. Send messages
4. Verify real-time updates

9.3 Test Payments

1. Go to Profile → Upgrade
2. Start checkout (use test card: 4242 4242 4242 4242)
3. Verify webhook processes payment
4. Check user tier updates

Step 10: Monitoring

10.1 Supabase Monitoring

1. Go to Supabase Dashboard → Project
2. Monitor:
   · Database size
   · API requests
   · Realtime connections
   · Storage usage

10.2 Vercel Analytics

1. Go to Vercel Dashboard → Analytics
2. Monitor:
   · Page views
   · Web vitals
   · Edge function invocations

10.3 Custom Monitoring

1. Check Supabase analytics_events table
2. Monitor user reports in admin panel
3. Track payment success rate

Troubleshooting

Common Issues

1. Email not sending
   · Check Resend domain verification
   · Verify API key in environment variables
   · Check email quotas
2. Real-time not working
   · Verify Supabase Realtime is enabled
   · Check WebSocket connections in browser
   · Verify RLS policies allow access
3. Payments not processing
   · Check Lemon Squeezy webhook URL
   · Verify webhook secret matches
   · Check database for checkout sessions
4. Database connection issues
   · Verify Supabase project is running
   · Check API keys in environment
   · Ensure RLS policies are correct

Performance Issues

1. Slow page loads
   · Enable Vercel CDN caching
   · Optimize images
   · Use Supabase connection pooling
2. High database load
   · Add missing indexes
   · Optimize queries
   · Enable query caching
3. Real-time latency
   · Choose region close to users
   · Optimize message payload size
   · Use presence efficiently

Maintenance

Regular Tasks

1. Daily
   · Check error logs
   · Monitor user reports
   · Review payment failures
2. Weekly
   · Backup database
   · Review analytics
   · Check service quotas
3. Monthly
   · Update dependencies
   · Review security settings
   · Analyze growth metrics

Scaling Up

When reaching free tier limits:

1. Supabase - Upgrade to Pro ($25/month)
2. Vercel - Upgrade to Pro ($20/month)
3. Resend - Upgrade to Pro ($20/month)
4. Monitoring - Add Sentry for error tracking

Security Checklist

· SSL/TLS enabled everywhere
· Environment variables encrypted
· Database backups enabled
· RLS policies reviewed
· Input validation implemented
· Rate limiting configured
· CORS properly set
· Content security policy enabled
· Regular dependency updates
· Security headers configured

Support

· Documentation: Check /docs folder
· Issues: GitHub repository issues
· Community: Discord/Slack channel
· Emergency: Contact via admin panel

Success Metrics

Track these KPIs:

1. User Growth - Signups per day
2. Engagement - Messages per user
3. Retention - Weekly active users
4. Monetization - Conversion rate
5. Quality - User report rate
6. Performance - Page load time

---

Your RANDO platform is now live! 🎉

Remember to:

1. Regularly monitor performance
2. Engage with your community
3. Gather user feedback
4. Iterate and improve features
5. Keep security up to date

Happy chatting! 💬