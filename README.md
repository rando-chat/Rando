# 💬 Rando Chat

> **Chat Randomly. Meet Authentically.**

![Rando Chat](https://img.shields.io/badge/Platform-Rando%20Chat-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-3.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

A modern, secure random chat platform connecting people through anonymous, meaningful conversations. Built with safety and user experience as top priorities.

![Rando Chat Preview](public/preview.png)

## ✨ Features

### 🛡️ Advanced Safety
- **Real-time Content Moderation** - AI-powered filtering system
- **Auto-ban System** - 3 strikes policy for violations
- **18+ Age Verification** - Strict age requirement enforcement
- **Privacy Protection** - No personal data required for guests

### 🤝 Smart Matching
- **Interest-based Algorithm** - Connect with like-minded people
- **Tier Priority System** - Premium users get faster matching
- **Queue Position Tracking** - See your place in line

### 💬 Real-time Chat
- **WebSocket-powered Messaging** - Instant message delivery
- **Typing Indicators** - See when others are typing
- **Online Presence** - Know who's available

### 👥 Access Options
- **24-hour Guest Sessions** - Chat without registration
- **Registered Accounts** - Enhanced features and preferences
- **Dual Access System** - Flexible user experience

### 🎯 Tier System
- **Free Tier** - Basic text chat features
- **Premium Tier** - $5.99/month (images + priority matching)
- **Student Tier** - $2.99/month (50% discount with .edu email)

### 📱 User Experience
- **Mobile-first Design** - Fully responsive for all devices
- **Intuitive Interface** - Clean, modern UI
- **Accessibility Features** - Inclusive design principles

## 🏗️ Architecture

**Modern & Scalable Stack:**

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Hosting**: Vercel with Edge Functions
- **Database**: Supabase PostgreSQL with Realtime
- **Authentication**: Supabase Auth with social providers
- **Storage**: Supabase Storage for media
- **Email**: Resend for verification and notifications
- **Payments**: Stripe/Lemon Squeezy for subscriptions
- **Analytics**: Custom tracking and monitoring
- **Security**: Multi-layer protection system

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or later
- npm, yarn, or pnpm
- Git
- Accounts: Supabase, Vercel, Resend

### 1. Clone & Setup

```bash
# Clone repository
git clone https://github.com/yourusername/rando-chat.git
cd rando-chat

# Install dependencies
npm install
```

2. Environment Configuration

Copy .env.example to .env.local:

```bash
cp .env.example .env.local
```

Edit .env.local with your API keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=hello@yourdomain.com
```

3. Local Development

```bash
# Start Supabase locally
npx supabase start

# Run migrations
npx supabase db push

# Start development server
npm run dev

# Visit: http://localhost:3000
```

4. Deploy to Production

```bash
# Build the application
npm run build

# Deploy to Vercel
npx vercel --prod
```

📁 Project Structure

```
rando-chat/
├── app/                    # Next.js 14 App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── chat/              # Chat interface
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/              # Auth components
│   ├── chat/              # Chat components
│   ├── matchmaking/       # Matchmaking UI
│   ├── ui/                # Reusable UI components
│   └── admin/             # Admin components
├── lib/                   # Utilities & services
│   ├── database/          # Supabase client
│   ├── auth/              # Auth helpers
│   ├── safety/            # Moderation system
│   └── utils/             # Helper functions
├── supabase/              # Database configuration
│   ├── migrations/        # Database migrations
│   ├── functions/         # PostgreSQL functions
│   └── seeds/             # Seed data
├── public/                # Static assets
│   ├── images/            # Images and icons
│   └── fonts/             # Font files
├── tests/                 # Test files
├── docs/                  # Documentation
└── scripts/               # Build/deployment scripts
```

🔧 Configuration

Environment Variables

Create a .env.local file in the root directory:

```bash
cp .env.example .env.local
```

Required Configuration:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=hello@yourdomain.com
```

Optional Configuration:

```env
# For Stripe payments (optional)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# For OpenAI moderation (optional)
OPENAI_API_KEY=your-openai-api-key

# For Lemon Squeezy payments (alternative)
LEMON_SQUEEZY_API_KEY=your-lemon-squeezy-api-key
```

⚠️ Important: Never commit .env.local to version control!

Required Services Setup

· Supabase: Create a project at supabase.com
· Resend: Sign up at resend.com for email functionality
· Stripe (optional): Create an account at stripe.com
· OpenAI (optional): Get API key from platform.openai.com

📦 Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database
npm run db:push      # Push database migrations
npm run db:reset     # Reset database
npm run db:studio    # Open Supabase Studio

# Code quality
npm run format       # Format code with Prettier
npm run analyze      # Analyze bundle size
```

🧪 Testing

Unit Tests

```bash
npm test
```

Integration Tests

```bash
npm run test:integration
```

End-to-End Tests

```bash
npm run test:e2e
```

Test Coverage

```bash
npm run test:coverage
```

🚀 Deployment

Deploy to Vercel (Recommended)

Push your code to GitHub
Import your repository on Vercel
Add your environment variables in Vercel dashboard
Deploy!

Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Vercel
npx vercel --prod

# Or deploy to other platforms
npm run export  # For static export
```

Environment Variables in Production

When deploying, set all required environment variables:

· Vercel: Project Settings → Environment Variables
· Netlify: Site Settings → Environment Variables
· Railway: Settings → Variables

📊 Database Setup

1. Create a Supabase Project at supabase.com
2. Run Migrations:

```bash
npx supabase db push
```

1. Configure Authentication in Supabase Dashboard

🤝 Contributing

Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

Development Guidelines

· Write clear commit messages
· Add tests for new features
· Update documentation as needed
· Follow the existing code style
· Keep PRs focused on a single change

📚 Documentation

· API Reference - Complete API documentation
· Database Schema - Table structures and relationships
· Architecture - System design and flow
· Deployment Guide - Production deployment instructions
· Security - Security practices and features

🛡️ Security

Security Features

· Row Level Security (RLS) on all tables
· JWT authentication with short-lived tokens
· Rate limiting on all endpoints
· Content moderation pipeline
· Audit logging for sensitive operations
· Automatic session cleanup

Best Practices for Developers

· Never commit secrets
· Rotate API keys regularly
· Use strong passwords
· Enable 2FA
· Keep dependencies updated

❓ FAQ

Is Rando Chat free?

Yes! Basic features are free. Premium features (priority matching, image sharing, extended history) are available through subscription.

What's the minimum age?

You must be at least 18 years old to use Rando Chat.

Can I use it without registering?

Yes! Guest sessions allow 24-hour anonymous chatting without any registration.

Is my data private?

Yes. We don't sell or share personal data. Messages are encrypted, and guest sessions require no personal information.

How does moderation work?

We use a multi-layer system: pattern detection, keyword filtering, user history tracking, and AI analysis for flagged content.

How do I get support?

· Documentation: docs.randochat.com
· GitHub Issues: Report bugs & features
· Email: support@randochat.com
· Discord: Join our community

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

· Next.js - React framework
· Supabase - Backend as a service
· Tailwind CSS - CSS framework
· Vercel - Hosting platform
· Lucide Icons - Beautiful icons
· All our amazing contributors

🚧 Roadmap

v1.1.0 (Q1 2026)

· Group chats (3-5 people)
· Voice messages
· Enhanced profile customization
· Advanced analytics dashboard

v1.2.0 (Q2 2026)

· Video chat capability
· AI conversation starters
· Language translation
· Mobile apps (iOS & Android)

Future

· Themed chat rooms
· Achievement system
· Third-party integrations
· Enterprise features

---

Ready to connect the world, one chat at a time. 💬

Get Started • View Demo • Report Issue

