#!/bin/bash

# Google OAuth Setup Helper Script
# This script helps you configure Google OAuth for your ComplianceTracker application

echo "🚀 Google OAuth Setup Helper"
echo "================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
    else
        echo "❌ .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

echo "📋 To complete Google OAuth setup, you need:"
echo "1. Google Cloud Console project"
echo "2. OAuth 2.0 credentials (Client ID and Secret)"
echo "3. Authorized redirect URIs configured"
echo ""

echo "🔗 Quick Links:"
echo "• Google Cloud Console: https://console.cloud.google.com/"
echo "• OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent"
echo "• Create Credentials: https://console.cloud.google.com/apis/credentials"
echo ""

echo "📝 Required Redirect URI for development:"
echo "http://localhost:3000/api/auth/callback/google"
echo ""

# Check current environment variables
echo "🔍 Current Environment Configuration:"
echo "================================="

# Check if Google OAuth is configured
if grep -q "GOOGLE_CLIENT_ID=" .env; then
    if grep -q "^GOOGLE_CLIENT_ID=your-google-client-id" .env || grep -q "^GOOGLE_CLIENT_ID=$" .env; then
        echo "❌ GOOGLE_CLIENT_ID: Not configured (using placeholder)"
    else
        echo "✅ GOOGLE_CLIENT_ID: Configured"
    fi
else
    echo "❌ GOOGLE_CLIENT_ID: Not found in .env"
fi

if grep -q "GOOGLE_CLIENT_SECRET=" .env; then
    if grep -q "^GOOGLE_CLIENT_SECRET=your-google-client-secret" .env || grep -q "^GOOGLE_CLIENT_SECRET=$" .env; then
        echo "❌ GOOGLE_CLIENT_SECRET: Not configured (using placeholder)"
    else
        echo "✅ GOOGLE_CLIENT_SECRET: Configured"
    fi
else
    echo "❌ GOOGLE_CLIENT_SECRET: Not found in .env"
fi

if grep -q "NEXTAUTH_SECRET=" .env; then
    if grep -q "^NEXTAUTH_SECRET=$" .env; then
        echo "❌ NEXTAUTH_SECRET: Not configured"
    else
        echo "✅ NEXTAUTH_SECRET: Configured"
    fi
else
    echo "❌ NEXTAUTH_SECRET: Not found in .env"
fi

if grep -q "NEXTAUTH_URL=" .env; then
    echo "✅ NEXTAUTH_URL: Configured"
else
    echo "❌ NEXTAUTH_URL: Not found in .env"
fi

echo ""
echo "🛠️  To configure Google OAuth:"
echo "1. Follow the guide: docs/google-oauth-setup.md"
echo "2. Update your .env file with:"
echo "   GOOGLE_CLIENT_ID=your-actual-client-id"
echo "   GOOGLE_CLIENT_SECRET=your-actual-client-secret"
echo "3. Restart your development server: npm run dev"
echo ""

# Check if development server is running
if pgrep -f "next dev" > /dev/null; then
    echo "🟢 Development server is running"
    echo "💡 After updating .env, restart with: npm run dev"
else
    echo "🔴 Development server not running"
    echo "💡 Start with: npm run dev"
fi

echo ""
echo "📖 For detailed instructions, see: docs/google-oauth-setup.md"
echo "🆘 Need help? Check: docs/22-faq.md"
