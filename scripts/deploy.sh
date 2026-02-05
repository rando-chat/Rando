#!/bin/bash

# RANDO Supabase Deployment Script

set -e

echo "🚀 RANDO Platform Deployment"
echo "============================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Build the application
echo "📦 Building application..."
npm run build

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "🌐 Deploying to Vercel..."
echo ""
echo "Follow these steps:"
echo "1. Login to Vercel if prompted"
echo "2. Select your project or create new"
echo "3. Add all environment variables from .env"
echo "4. Wait for deployment to complete"
echo ""

vercel --prod

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up custom domain in Vercel"
echo "2. Configure Cloudflare for SSL"
echo "3. Set up Lemon Squeezy webhook"
echo "4. Test the chat functionality"
echo ""
echo "Your app is now live! 🎉"