#!/bin/bash

# Multi-Tenant Notes SaaS Deployment Script for Vercel

echo "🚀 Deploying Multi-Tenant Notes SaaS to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - DATABASE_URL (your production database URL)"
echo "   - JWT_SECRET (strong secret for JWT signing)"
echo ""
echo "2. If using a new database, run:"
echo "   vercel env pull .env.local"
echo "   npm run db:push"
echo "   npm run db:seed"
echo ""
echo "3. Test your deployment with:"
echo "   npm test"