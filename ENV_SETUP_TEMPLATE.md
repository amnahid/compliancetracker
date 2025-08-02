# 🔧 Environment Variables Setup Guide

## ⚠️ SECURITY NOTICE
**NEVER commit actual API keys or secrets to version control!**

## 📋 Required Environment Variables

Copy the following template to your `.env.local` file and replace with your actual values:

```env
# Database
MONGODB_URI=your-mongodb-connection-string

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-generate-a-long-random-string
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (Get from GitHub Developer Settings)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Stripe Configuration (Get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_PRICE_ID_HEALTHCARE_COMPLIANCE=price_your-price-id

# Email Service (Get from Resend)
RESEND_API_KEY=re_your-resend-api-key

# AWS S3 Configuration (Get from AWS Console)
AWS_ACCESS_KEY_ID=AKIA-your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=your-preferred-region
AWS_S3_BUCKET=your-bucket-name

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_OG_IMAGE_URL=http://localhost:3000/og-image.png
DEFAULT_PLAN_NAME=Free Plan
```

## 🛠️ Setup Instructions

### 1. Create Your Environment File
```bash
# Copy the example to create your local environment file
cp .env.example .env.local
```

### 2. Get Your API Keys

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`

#### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your test API keys from the API keys section
3. Create a product and get the price ID

#### Resend (Email)
1. Go to [Resend](https://resend.com/)
2. Create an account and get your API key

#### AWS S3 (File Storage)
1. Create an AWS account
2. Create an S3 bucket
3. Create an IAM user with S3 permissions
4. Generate access keys

### 3. Generate Secrets
```bash
# Generate a secure NextAuth secret
openssl rand -base64 32
```

## 🔒 Security Best Practices

✅ **DO:**
- Keep `.env.local` files in `.gitignore`
- Use different keys for development and production
- Rotate keys regularly
- Use least-privilege access for API keys
- Store production secrets in your hosting platform's environment variables

❌ **DON'T:**
- Commit `.env` files to version control
- Share API keys in chat or email
- Use production keys in development
- Hard-code secrets in your application code

## 🚀 Deployment

For production deployment, set these environment variables in your hosting platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables  
- **Railway**: Project → Variables
- **Azure**: App Service → Configuration → Application Settings

## 📞 Need Help?

If you encounter issues:
1. Check that all required environment variables are set
2. Verify API keys are valid and have proper permissions
3. Ensure callback URLs match your domain
4. Check the console for specific error messages

**Status: Ready for secure setup** 🔐
