#!/bin/bash

# RANDO Supabase Setup Script
# 100% Free Chat Platform

set -e

echo "🚀 RANDO Supabase Platform Setup"
echo "================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Install from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not installed."
    exit 1
fi
echo -e "${GREEN}✓ npm: $(npm --version)${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi
echo -e "${GREEN}✓ Supabase CLI${NC}"

# Initialize Supabase
echo ""
echo "🔥 Setting up Supabase..."
if [ ! -f "supabase/config.toml" ]; then
    npx supabase init
fi

echo ""
echo "📋 Environment Setup"
echo "===================="
echo ""
echo "Please set up the following environment variables:"

cat <<EOF

# Copy this to .env file:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
LEMON_SQUEEZY_API_KEY=your-lemon-key
LEMON_STORE_ID=your-store-id
LEMON_PRODUCT_ID=your-product-id
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

EOF

read -p "Have you updated the .env file? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update .env file before continuing."
    exit 1
fi

# Start Supabase locally
echo ""
echo "🚀 Starting Supabase locally..."
npx supabase start

echo ""
echo "📊 Applying database migrations..."
npx supabase db reset

echo ""
echo "🌐 Starting development server..."
echo "The app will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Start the app
npm run dev