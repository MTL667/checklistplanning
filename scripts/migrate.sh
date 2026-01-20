#!/bin/bash
# Database Migration Script for Production
# Run this script to apply database migrations

set -e

echo "🗄️  Planning Checklist - Database Migration"
echo "============================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it with:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/database'"
    exit 1
fi

echo "📊 Checking database connection..."

# Run migrations
echo "🚀 Running database migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Migrations completed successfully!"
echo ""

# Optional: Show current migration status
echo "📋 Current migration status:"
npx prisma migrate status

echo ""
echo "🎉 Done!"
