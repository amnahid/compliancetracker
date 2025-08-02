# 🔐 Authentication System

## Overview

The Healthcare Compliance Application uses **NextAuth.js** for authentication, providing secure user management with multiple authentication methods and role-based access control.

## How Authentication Works

### 1. NextAuth.js Foundation

NextAuth.js handles all the complex authentication logic:

- **Session Management** - Automatic session creation and validation
- **JWT Tokens** - Secure token-based authentication with role information
- **CSRF Protection** - Built-in Cross-Site Request Forgery protection
- **Multiple Providers** - Support for OAuth and credentials
- **Role-Based Access** - Admin and user roles with proper session handling

### 2. Authentication Flow

```text
User Login Request
    ↓
NextAuth.js validates credentials
    ↓
If valid: JWT token created with role data
    ↓
Session stored with user role and organization
    ↓
User redirected to dashboard with proper permissions
```

### 3. OAuth vs Credentials Flow

#### OAuth (Google/GitHub) Flow

```text
OAuth Provider Authentication
    ↓
User data received (including email)
    ↓
Check if user exists in database
    ↓
If new: Create user with default 'user' role
If existing: Load role from database
    ↓
JWT token includes role and organization
    ↓
Session created with complete user data
```

#### Credentials Flow

```text
Email/Password submitted
    ↓
Password verified with bcrypt
    ↓
User data loaded from database
    ↓
JWT token created with role information
    ↓
Session established with proper permissions
```

## Configuration

### NextAuth Configuration File

Location: `lib/auth.ts`

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth (if configured)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Credentials provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validation logic with role loading
      }
    })
  ],
  callbacks: {
    // JWT callback handles role updates
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.organization = user.organization;
      }
      
      // Handle session updates (like role upgrades)
      if (trigger === 'update' && token.email) {
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.role = dbUser.role;
          token.organization = dbUser.organization;
        }
      }
      
      return token;
    },
    
    // Session callback ensures role is available
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.organization = token.organization;
      
      // Fallback: fetch role from database if missing
      if (!token.role && session.user?.email) {
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.organization = dbUser.organization;
        }
      }
      
      return session;
    }
  }
};
```
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // JWT token customization
    },
    async session({ session, token }) {
      // Session customization
    }
  }
}
```

### Key Components

1. **MongoDB Adapter** - Stores user sessions in MongoDB
2. **Credentials Provider** - Email/password authentication
3. **JWT Callback** - Customizes JWT token content
4. **Session Callback** - Customizes session object

## User Registration

### Registration Flow

1. **User fills signup form** (`app/auth/signup/page.tsx`)
2. **Form data sent** to `/api/auth/signup`
3. **Password hashed** using bcrypt
4. **User created** in MongoDB
5. **Automatic login** and redirect to dashboard

### Signup API Endpoint

Location: `app/api/auth/signup/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { name, email, password, organization } = await request.json();
  
  // Validate input
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    organization,
    role: 'user'
  });
  
  return NextResponse.json({ message: 'User created successfully' });
}
```

## User Login

### Login Flow

1. **User enters credentials** on login page
2. **NextAuth.js validates** credentials
3. **Session created** with user information
4. **Redirect to dashboard** or requested page

### Login Page

Location: `app/auth/signin/page.tsx`

- Uses NextAuth's `signIn` function
- Handles form validation
- Shows error messages
- Redirects on success

## Session Management

### Session Object Structure

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    organization: string;
    image?: string;
  };
  expires: string;
}
```

### Using Sessions in Components

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <p>Loading...</p>
  if (status === "unauthenticated") return <p>Not logged in</p>
  
  return <p>Welcome {session?.user?.name}!</p>
}
```

### Using Sessions in API Routes

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // User is authenticated
  return NextResponse.json({ user: session.user });
}
```

## Role-Based Access Control

### User Roles

1. **User** - Default role for new registrations
2. **Admin** - Elevated permissions for system management

### Role Implementation

```typescript
// Database Model
const UserSchema = new Schema({
  // ... other fields
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

// API Route Protection
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Component Conditional Rendering
{session?.user?.role === 'admin' && (
  <AdminOnlyComponent />
)}
```

### Role Upgrade System

Users can upgrade to admin using bootstrap codes:

```typescript
// Location: app/api/auth/upgrade-role/route.ts
const validCodes = ['FIRST_ADMIN_2024', 'BOOTSTRAP_ADMIN'];

if (!validCodes.includes(upgradeCode)) {
  return NextResponse.json({ error: 'Invalid upgrade code' }, { status: 400 });
}

await User.findOneAndUpdate(
  { email: session.user.email },
  { role: 'admin' }
);
```

## Route Protection

### Middleware Protection

Location: `middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }
}
```

### API Route Protection

```typescript
// Check authentication
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

// Check admin role
if (session.user.role !== 'admin') {
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}
```

## Password Security

### Password Hashing

Uses **bcrypt** for secure password hashing:

```typescript
import bcrypt from 'bcryptjs';

// Hash password during registration
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password during login
const isValidPassword = await bcrypt.compare(password, user.password);
```

### Password Requirements

- Minimum 8 characters
- Required for all non-OAuth users
- Hashed with bcrypt (12 rounds)
- Never stored in plain text

## Account Deletion

### Self-Deletion

Users can delete their own accounts:

```typescript
// Location: app/api/auth/delete-account/route.ts

// Verify password (if user has one)
if (user.password && password) {
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
  }
}

// Require confirmation
if (confirmDelete !== 'DELETE') {
  return NextResponse.json({ error: 'Must type DELETE to confirm' }, { status: 400 });
}

// Delete user and cleanup
await User.findByIdAndDelete(user._id);
```

### Admin Deletion

Admins can delete other users with safeguards:

- Cannot delete themselves
- Cannot delete the last admin
- Automatically cancels Stripe subscriptions

## Security Features

### Built-in Protections

1. **CSRF Protection** - NextAuth.js built-in protection
2. **Session Validation** - Automatic token validation
3. **Secure Headers** - Security headers configured
4. **Rate Limiting** - API endpoint protection

### Best Practices Implemented

1. **Password Hashing** - Bcrypt with 12 rounds
2. **Input Validation** - All inputs validated and sanitized
3. **Environment Variables** - Secrets stored securely
4. **Role Verification** - Double-check permissions
5. **Session Expiry** - Automatic session timeout

## Debugging Authentication

### Common Issues

1. **NEXTAUTH_SECRET not set** - Required for JWT signing
2. **NEXTAUTH_URL incorrect** - Must match your domain
3. **Database connection** - Check MongoDB connection
4. **Session not updating** - Use `update()` function

### Staff Panel Access Issues

If you see "Access Restricted" for staff panel despite being admin:

#### Problem: Session Role vs Database Role Mismatch

**Symptoms:**
- Database shows role: "admin"
- Session shows role: "undefined" or "user"
- Staff panel shows "Access Restricted"

**Root Cause:**
JWT token doesn't have updated role information, especially common with OAuth users.

**Solutions:**

1. **Force Session Refresh:**
   ```typescript
   // Use the Force Refresh button on staff page
   await update({ trigger: 'update' });
   window.location.reload();
   ```

2. **Complete Sign Out/In:**
   - Sign out completely
   - Sign back in
   - Session rebuilds with current database role

3. **Check Debug Information:**
   - Go to `/dashboard/staff`
   - Look at debug panel for role mismatch
   - Use "Check DB Role" button

#### Problem: OAuth ID vs MongoDB ObjectId

**Symptoms:**
- Error: "Cast to ObjectId failed"
- Google/GitHub OAuth users can't access admin features

**Root Cause:**
System trying to use OAuth provider ID (like Google ID) as MongoDB ObjectId.

**Solution:**
Updated auth callbacks to use email for database lookups instead of provider ID.

#### Problem: Missing Role in JWT Token

**Symptoms:**
- Session role always undefined
- OAuth users don't get roles

**Root Cause:**
JWT token created without role information during OAuth sign-in.

**Solution:**
Enhanced OAuth sign-in callback to populate user object with role data.

### Debug Tools

```typescript
// Log session in component
console.log('Session:', session);
console.log('Status:', status);

// Check user in database
const response = await fetch('/api/auth/me');
const userData = await response.json();
console.log('DB User:', userData);

// Force session update
await update({ trigger: 'update' });
```

### Debug API Endpoints

**Check Current User:**
```
GET /api/auth/me
```
Returns both session data and fresh database data for comparison.

**Force Session Refresh:**
```
POST /api/auth/refresh-session
```
Forces session refresh from database.

### Environment Variables

Required for authentication:

```env
NEXTAUTH_SECRET=your-secret-key-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/healthcare-compliance
```

## Recent Fixes (2025)

### Session Role Update Fix

**Issue:** Sessions not updating after role upgrades.

**Fix:** Enhanced JWT callback to handle `trigger: 'update'` properly:

```typescript
async jwt({ token, user, trigger }) {
  if (trigger === 'update' && token.email) {
    const dbUser = await User.findOne({ email: token.email });
    if (dbUser) {
      token.role = dbUser.role;
      token.organization = dbUser.organization;
    }
  }
  return token;
}
```

### OAuth Role Population Fix

**Issue:** OAuth users created without role information.

**Fix:** Enhanced signIn callback to set default role and populate user object:

```typescript
async signIn({ user, account }) {
  if (account?.provider === 'google') {
    const existingUser = await User.findOne({ email: user.email });
    if (existingUser) {
      user.role = existingUser.role;
      user.organization = existingUser.organization;
    } else {
      // Create new user with default role
      const newUser = await User.create({
        email: user.email,
        role: 'user', // Default role
        // ... other fields
      });
      user.role = newUser.role;
    }
  }
  return true;
}
```

---

**Next: Learn about [User Management](./08-user-management.md) features!**
