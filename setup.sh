#!/bin/bash

# ComplianceTracker Setup Script
# This script helps you set up the healthcare compliance tracking application

echo "🏥 ComplianceTracker - Healthcare Compliance Management System"
echo "============================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ before continuing."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ before continuing."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if MongoDB is running (optional)
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB detected"
else
    echo "⚠️  MongoDB not detected locally. You can:"
    echo "   1. Install MongoDB locally, or"
    echo "   2. Use MongoDB Atlas (cloud database)"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔧 Setting up environment variables..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || cat > .env << EOF
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/compliance-tracker

# NextAuth Configuration  
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Optional: OAuth Providers
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=

# Optional: Email Configuration
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASSWORD=

# Optional: Stripe Configuration
# STRIPE_SECRET_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Generate NextAuth secret
echo ""
echo "🔐 Generating authentication secret..."
node generate-secret.js

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit the .env file with your database connection string"
echo "   2. Add the generated NEXTAUTH_SECRET to your .env file"
echo "   3. Start the development server: npm run dev"
echo "   4. Open http://localhost:3000 in your browser"
echo "   5. Create your first admin account"
echo ""
echo "📖 For detailed setup instructions, see the README.md file"
echo ""
echo "🏥 Welcome to ComplianceTracker!"
