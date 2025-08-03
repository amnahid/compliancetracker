# Google OAuth Setup Guide

Complete step-by-step guide for setting up Google OAuth authentication in your ComplianceTracker application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Console Setup](#google-cloud-console-setup)
3. [Environment Configuration](#environment-configuration)
4. [Code Implementation](#code-implementation)
5. [Testing OAuth Flow](#testing-oauth-flow)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] Google account (Gmail or Google Workspace)
- [ ] ComplianceTracker project running locally
- [ ] Access to your project's `.env` file
- [ ] Basic understanding of OAuth 2.0 flow

## 🚀 Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. **Visit Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Create New Project**
   - Click "Select a project" dropdown
   - Click "NEW PROJECT"
   - Project name: `ComplianceTracker OAuth`
   - Organization: Select your organization (if applicable)
   - Click "CREATE"

3. **Select Your Project**
   - Ensure your new project is selected in the dropdown

### Step 2: Enable Google+ API

1. **Navigate to APIs & Services**
   ```
   APIs & Services > Library
   ```

2. **Search and Enable APIs**
   - Search for "Google+ API"
   - Click "Google+ API"
   - Click "ENABLE"
   - Also enable "People API" for better profile data

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   ```
   APIs & Services > OAuth consent screen
   ```

2. **Choose User Type**
   - Select "External" for public applications
   - Select "Internal" if using Google Workspace
   - Click "CREATE"

3. **App Information**
   ```
   App name: ComplianceTracker
   User support email: your-email@domain.com
   Developer contact: your-email@domain.com
   ```

4. **App Domain (Optional)**
   ```
   Application home page: https://your-domain.com
   Application privacy policy: https://your-domain.com/privacy
   Application terms of service: https://your-domain.com/terms
   ```

5. **Authorized Domains**
   ```
   For development: localhost
   For production: your-domain.com
   ```

6. **Scopes**
   - Click "ADD OR REMOVE SCOPES"
   - Add these scopes:
   ```
   openid
   email
   profile
   ```

7. **Test Users (for External apps)**
   - Add your email addresses for testing
   - Click "SAVE AND CONTINUE"

### Step 4: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   ```
   APIs & Services > Credentials
   ```

2. **Create Credentials**
   - Click "+ CREATE CREDENTIALS"
   - Select "OAuth client ID"

3. **Application Type**
   - Select "Web application"
   - Name: `ComplianceTracker Web Client`

4. **Authorized JavaScript Origins**
   ```
   Development:
   http://localhost:3000
   
   Production:
   https://your-domain.com
   ```

5. **Authorized Redirect URIs**
   ```
   Development:
   http://localhost:3000/api/auth/callback/google
   
   Production:
   https://your-domain.com/api/auth/callback/google
   ```

6. **Create and Download**
   - Click "CREATE"
   - Copy the Client ID and Client Secret
   - Optionally download the JSON file

## 🔧 Environment Configuration

### Step 1: Update .env File

1. **Open your `.env` file**
   ```bash
   # Location: /tech_resume/.env
   ```

2. **Add Google OAuth Credentials**
   ```properties
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   
   # Make sure these are also set
   NEXTAUTH_SECRET=your-nextauth-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Example Configuration**
   ```properties
   # Google OAuth
   GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-1234567890abcdefghijk
   
   # NextAuth
   NEXTAUTH_SECRET=your-super-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

### Step 2: Update .env.example

Add the Google OAuth section to your `.env.example` file:

```properties
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 💻 Code Implementation

The authentication code is already implemented in your project! Here's what's already configured:

### Current Implementation in `lib/auth.ts`

```typescript
// Google OAuth is conditionally loaded
...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  })
] : [])
```

### User Registration Flow

When a user signs in with Google OAuth, the system:

1. **Checks if user exists** in MongoDB
2. **Creates new user** if not found
3. **Updates user information** from Google profile
4. **Assigns appropriate role** (user/admin)
5. **Creates session** with NextAuth

### Profile Information Captured

From Google OAuth, the system captures:
- Email address
- Full name
- Profile picture
- Google ID
- Email verification status

## 🧪 Testing OAuth Flow

### Step 1: Start Development Server

```bash
cd /tech_resume
npm run dev
```

### Step 2: Access Sign-In Page

1. **Navigate to your app**
   ```
   http://localhost:3000
   ```

2. **Click Sign-In**
   - Look for "Sign in with Google" button
   - Should be visible on the login page

### Step 3: Test OAuth Flow

1. **Click "Sign in with Google"**
2. **Google Authorization**
   - Redirects to Google
   - Shows consent screen
   - Lists requested permissions
3. **Grant Permission**
   - Click "Allow" or "Continue"
4. **Redirect Back**
   - Returns to your application
   - Should be signed in
   - Check user profile

### Step 4: Verify Database

Check MongoDB to ensure user was created:

```javascript
// In MongoDB or using MongoDB Compass
db.users.find({ provider: "google" })
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. "Error 400: redirect_uri_mismatch"

**Problem:** The redirect URI doesn't match what's configured in Google Console.

**Solution:**
- Check your Google Console authorized redirect URIs
- Ensure exact match including protocol (http/https)
- For development: `http://localhost:3000/api/auth/callback/google`

#### 2. "Client ID not found"

**Problem:** Google Client ID is incorrect or not set.

**Solution:**
- Verify `GOOGLE_CLIENT_ID` in `.env` file
- Check for typos in the client ID
- Ensure environment variables are loaded

#### 3. "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen not properly configured.

**Solution:**
- Complete OAuth consent screen setup
- Add your domain to authorized domains
- Verify app is not in testing mode (for production)

#### 4. "Sign in with Google button not appearing"

**Problem:** Environment variables not properly loaded.

**Solution:**
```bash
# Restart your development server
npm run dev

# Check environment variables are loaded
console.log(process.env.GOOGLE_CLIENT_ID) // Should not be undefined
```

#### 5. "Database connection error during OAuth"

**Problem:** MongoDB connection issues during user creation.

**Solution:**
- Verify `MONGODB_URI` is correct
- Ensure MongoDB is running
- Check database permissions

### Debug Mode

Enable debug logging by adding to your `.env`:

```properties
# Enable NextAuth debug logging
NEXTAUTH_DEBUG=true
```

### Testing with Different Accounts

1. **Use incognito/private browsing** for fresh sessions
2. **Test with multiple Google accounts**
3. **Verify user roles are assigned correctly**

## 🛡️ Security Best Practices

### Environment Variables

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for `NEXTAUTH_SECRET`
3. **Rotate credentials regularly** in production

### Google Console Security

1. **Restrict authorized domains** to your actual domains
2. **Monitor OAuth usage** in Google Console
3. **Enable audit logging** for production applications

### Application Security

1. **Validate user data** from OAuth providers
2. **Implement rate limiting** on authentication endpoints
3. **Log authentication events** for monitoring

### Production Deployment

1. **Update authorized domains** for production URLs
2. **Use environment-specific credentials**
3. **Enable OAuth consent screen verification**

## 📈 Production Deployment

### Vercel Deployment

1. **Add environment variables** in Vercel dashboard:
   ```
   GOOGLE_CLIENT_ID=your-production-client-id
   GOOGLE_CLIENT_SECRET=your-production-client-secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

2. **Update Google Console** with production URLs:
   ```
   Authorized origins: https://your-domain.vercel.app
   Redirect URIs: https://your-domain.vercel.app/api/auth/callback/google
   ```

### Custom Domain

1. **Update environment variables**:
   ```
   NEXTAUTH_URL=https://your-custom-domain.com
   ```

2. **Update Google Console** with custom domain URLs

## 🔗 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [MongoDB User Schema Reference](./08-user-management.md)

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Environment variables set in `.env`
- [ ] Development server restarted
- [ ] Sign-in flow tested successfully
- [ ] User created in database
- [ ] Production URLs updated (if deploying)

---

**Need help?** Check the [FAQ](./22-faq.md) or review the authentication documentation in `07-authentication.md`.
