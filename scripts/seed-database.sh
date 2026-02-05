#!/bin/bash

# Database seeding script for RANDO

set -e

echo "🌱 Seeding RANDO database..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing Supabase environment variables"
    exit 1
fi

# Run seed SQL
echo "Running seed script..."
npx supabase db reset

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "Test accounts:"
echo "Admin: admin@example.com / admin123"
echo "Student: student@example.edu / student123"
echo "Premium: premium@example.com / premium123"
echo "Free: free@example.com / free123"