#!/bin/bash

echo "🚀 Starting production deployment..."

# Set production environment
export NODE_ENV=production

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database if empty (check for existing data first)
echo "🌱 Checking if database needs seeding..."
MODEL_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM models;" 2>/dev/null | tail -1 || echo "0")

if [ "$MODEL_COUNT" = "0" ]; then
  echo "🌱 Seeding database with initial data..."
  npx prisma db seed
else
  echo "✅ Database already has data, skipping seed"
fi

echo "✅ Deployment complete!" 