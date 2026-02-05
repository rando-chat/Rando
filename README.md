# 🚀 RANDO - 100% Free Random Chat Platform

> **Chat Randomly. Meet Authentically.**
> **Complete with Supabase, Vercel, and 100% Free Services**

![RANDO Platform](https://img.shields.io/badge/Platform-RANDO-purple)
![Free Tier](https://img.shields.io/badge/Cost-$0%2Fmonth-green)
![React](https://img.shields.io/badge/React-18-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald)
![Vercel](https://img.shields.io/badge/Vercel-Edge%20Functions-black)

## ✨ Features

### 💬 Core Features
- **100% Free Forever** - No monthly costs, no subscriptions required
- **Text Chat Only** - Focus on meaningful conversations
- **🔒 Link Blocking** - ALL URLs blocked automatically for safety
- **📸 Image Sharing** - Premium/Student only (5MB max)
- **📧 Email Verification** - Using Resend (3k free emails/month)
- **👨‍🎓 Student Discount** - 50% off with .edu email verification

### 🛡️ Safety Features
- **Complete URL blocking** - No links allowed in chat
- **Content moderation** - Profanity, PII, and harassment detection
- **User reporting system** - 3 reports = auto-ban
- **Age verification** - 18+ requirement
- **Real-time monitoring** - Admin dashboard for moderation

### 💰 Monetization (Optional)
- **Free**: Unlimited text chat, forever free
- **Premium**: $4.99/month (images + priority matching)
- **Student**: $2.49/month (50% discount with .edu email)
- **No monthly platform fees** - Only payment processing fees (3.5%)

## 🏗️ Architecture

**100% Serverless & Free:**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Hosting**: Vercel (Always free, 100GB bandwidth)
- **Database**: Supabase PostgreSQL (Free 500MB)
- **Auth**: Supabase Auth (Free 50k MAU)
- **Realtime**: Supabase Realtime (WebSockets)
- **Storage**: Supabase Storage (Free 1GB)
- **Email**: Resend (Free 3k emails/month)
- **Payments**: Lemon Squeezy (No monthly fee, 3.5% per transaction)
- **Analytics**: Google Analytics 4 (Free)
- **Domain**: Cloudflare (Free SSL/CDN)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- Accounts: Supabase, Vercel, Resend, Lemon Squeezy

### 1. Clone & Setup

```bash
# Clone repository
git clone https://github.com/yourusername/rando-supabase.git
cd rando-supabase

# Install dependencies
npm install

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

2. Environment Configuration

Copy .env.example to .env and configure:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=hello@yourdomain.com

# Payments (Lemon Squeezy)
LEMON_SQUEEZY_API_KEY=ls_sk_xxxxxxxxxxxxxxxxxxxxxxxx
LEMON_STORE_ID=12345
LEMON_PRODUCT_ID=12345

# Domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

3. Local Development

```bash
# Start Supabase locally
npx supabase start

# Start development server
npm run dev

# Visit: http://localhost:3000
```

4. Deploy to Production

```bash
# Deploy with one command
./scripts/deploy.sh

# Or manually:
vercel --prod
```

📁 Project Structure

```
rando-supabase/
├── app/                          # React Frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility libraries
│   │   ├── pages/              # Page components
│   │   ├── styles/             # Global styles
│   │   ├── types/              # TypeScript types
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   └── public/                 # Static assets
├── api/                         # Vercel Edge Functions
│   ├── email/                  # Email sending functions
│   ├── payments/               # Payment processing
│   └── moderation/             # Content moderation
├── supabase/                   # Database configuration
│   ├── migrations/             # Database migrations
│   ├── functions/              # PostgreSQL functions
│   └── seed.sql               # Sample data
├── docs/                       # Documentation
├── scripts/                    # Setup & deployment scripts
└── README.md                  # This file
```

🗄️ Database Schema

Key tables:

· users - User profiles (extends Supabase Auth)
· chat_sessions - Active chat sessions
· messages - Chat messages with real-time updates
· matchmaking_queue - Users waiting for matches
· reports - User reports for moderation
· email_verifications - Email verification codes

🔐 Security Features

Row Level Security (RLS)

Every table has RLS policies ensuring users can only access their own data.

Content Safety

· All URLs blocked automatically
· Profanity filter
· Phone/email detection
· User reporting with auto-ban

Authentication

· JWT-based authentication
· Email verification required
· Secure password hashing
· Session management

💰 Cost Breakdown

Monthly Cost: $0

Service Free Tier Limits
Supabase Free 50k MAU, 500MB DB, 1GB storage
Vercel Free 100GB bandwidth, 100k Edge Functions
Resend Free 3k emails/month
Lemon Squeezy Free No monthly fee, 3.5% per transaction
Cloudflare Free Unlimited CDN, free SSL
Total $0/month Scalable to 50k users

📈 Scalability

Free Tier Limits

· Users: Up to 50,000 monthly active users
· Storage: 500MB database + 1GB file storage
· Bandwidth: 100GB/month on Vercel
· Emails: 3,000/month on Resend

When to Upgrade

1. > 50k MAU → Supabase Pro ($25/month)
2. > 3k emails → Resend Pro ($20/month)
3. > 100GB bandwidth → Vercel Pro ($20/month)
4. > 500MB database → Supabase storage upgrade

🎯 Features in Detail

Real-time Chat

· WebSocket connections via Supabase Realtime
· Instant message delivery
· Online user presence
· Typing indicators (future)

Matchmaking System

· Smart matching based on interests
· Tier-based priority (Premium > Student > Free)
· Queue system with position tracking
· Automatic cleanup of stale entries

Email System

· Verification codes for signup
· Student verification for .edu emails
· Welcome emails
· Password reset (future)

Payment Processing

· Lemon Squeezy integration
· One-time and subscription payments
· Student discount automation
· Webhook handling for payment events

Admin Dashboard

· User management
· Report review system
· Analytics overview
· Content moderation tools

🧪 Testing

Test Accounts

After seeding the database:

```bash
# Run seed script
./scripts/seed-database.sh
```

Test accounts:

· Admin: admin@example.com / admin123
· Student: student@example.edu / student123
· Premium: premium@example.com / premium123
· Free: free@example.com / free123

Testing Flow

1. Register new account
2. Verify email
3. Start matchmaking
4. Test chat functionality
5. Test image upload (premium/student)
6. Test user reporting
7. Test payment flow

🚨 Important Notes

Free Services Limitations

1. Supabase: 2 projects max on free tier
2. Vercel: 100GB bandwidth/month
3. Resend: 100 emails/day sending limit
4. Lemon Squeezy: Test mode for development

Production Readiness

· Set up custom domain
· Configure SSL certificates
· Set up monitoring
· Configure backups
· Set up error tracking
· Create privacy policy & terms

📊 Analytics

Tracked events:

· sign_up - New user registration
· login - User login
· email_verified - Email verification
· matchmaking_started - User joined queue
· match_found - Successful match
· message_sent - Message sent
· user_reported - User reported
· payment_started - Checkout initiated
· payment_completed - Payment successful

🔧 Configuration

Customization Options

1. Branding
   · Colors in tailwind.config.js
   · Logo in public/ folder
   · Email templates in API functions
2. Features
   · Enable/disable image sharing
   · Adjust matchmaking algorithm
   · Modify content moderation rules
3. Pricing
   · Update prices in Lemon Squeezy
   · Modify tier benefits in code
   · Add new payment plans

Environment Variables

See .env.example for all required variables.

🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

Development Guidelines

· Follow TypeScript best practices
· Write comprehensive documentation
· Add tests for new features
· Update migration files for database changes

📞 Support

· Issues: GitHub Issues
· Documentation: /docs folder
· Community: Discord/Slack (to be created)
· Email: Configured via Resend

📚 Documentation

· Architecture - Technical architecture
· Deployment Guide - Step-by-step deployment
· API Reference - API documentation

🎉 Launch Checklist

· Deploy to Vercel
· Configure custom domain
· Set up SSL certificates
· Configure email domain
· Set up payment products
· Test all user flows
· Set up monitoring
· Create admin accounts
· Configure backups
· Launch! 🚀

📄 License

This project is open source. See LICENSE file for details.

🙏 Acknowledgments

· Supabase for the amazing backend platform
· Vercel for seamless deployment
· Resend for reliable email delivery
· Lemon Squeezy for simple payments
· Cloudflare for free SSL and CDN

---

Built with ❤️ for authentic connections

Powered by free services for accessibility

Ready to connect the world, one chat at a time 💬