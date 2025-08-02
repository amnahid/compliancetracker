# 🚀 Quick Start Guide

Get the Healthcare Compliance Application running in 5 minutes!

## Prerequisites

Before you start, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (local or cloud instance)
- **Git** for version control

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd tech_resume

# Install dependencies
npm install
```

## Step 2: Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/healthcare-compliance
# or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/healthcare-compliance

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (optional for development)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Stripe Configuration (optional for development)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 3: Run the Application

```bash
# Start the development server
npm run dev
```

The application will be available at: **http://localhost:3000**

## Step 4: First Time Setup

1. **Open your browser** and go to `http://localhost:3000`
2. **Click "Sign Up"** to create your first account
3. **Go to Settings** after signing up
4. **Use upgrade code** `FIRST_ADMIN_2024` to become an admin
5. **Access Admin Dashboard** at `/admin`

## 🎉 You're Ready!

Your Healthcare Compliance Application is now running with:

- ✅ **User Authentication** (Login/Signup)
- ✅ **Role-Based Access** (Admin/User)
- ✅ **Settings Management**
- ✅ **Admin Dashboard**
- ✅ **Account Management**

## Next Steps

- 📖 Read the [Project Overview](./03-project-overview.md) to understand what you're working with
- 🏗️ Check [Project Structure](./05-project-structure.md) to navigate the codebase
- 🔐 Learn about [Authentication](./07-authentication.md) system
- 👥 Explore [User Management](./08-user-management.md) features

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

### MongoDB Connection Issues
- Make sure MongoDB is running locally
- Check your `MONGODB_URI` in `.env.local`
- For MongoDB Atlas, verify network access settings

### Environment Variables Not Loading
- Restart the development server after changing `.env.local`
- Make sure the file is named exactly `.env.local`

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## File Structure Overview

```
tech_resume/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard pages
│   └── admin/             # Admin-only pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── docs/                  # Documentation (you're here!)
└── public/               # Static assets
```

---

**Need help?** Check the [FAQ](./22-faq.md) or [Troubleshooting](./21-troubleshooting.md) guides!
