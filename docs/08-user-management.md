# 👥 User Management System

## Overview

The User Management system provides comprehensive tools for managing user accounts, roles, and permissions. It includes both self-service features for users and administrative tools for system management.

## User Data Model

### Database Schema

Location: `lib/models/User.ts`

```typescript
interface IUser {
  email: string;                    // Unique identifier
  name: string;                     // Display name
  password?: string;                // Hashed password (optional for OAuth)
  image?: string;                   // Profile picture URL
  role: 'user' | 'admin';          // User role
  organization?: string;            // Organization name
  emailVerified?: Date;             // Email verification timestamp
  stripeCustomerId?: string;        // Stripe customer ID
  subscription?: {                  // Subscription details
    id: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
    plan: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialStart?: Date;
    trialEnd?: Date;
  };
  trialEndsAt?: Date;              // Trial period end
  notificationSettings?: {          // User preferences
    emailNotifications: boolean;
    taskReminders: boolean;
    documentExpiration: boolean;
    systemUpdates: boolean;
    weeklyReports: boolean;
  };
  securitySettings?: {             // Security preferences
    twoFactorEnabled: boolean;
    sessionTimeout: string;
    passwordExpiry: string;
    requirePasswordChange: boolean;
  };
  createdAt: Date;                 // Account creation
  updatedAt: Date;                 // Last update
}
```

## User Roles and Permissions

### Role Hierarchy

1. **User (Default)**
   - Access to personal dashboard
   - Profile management
   - Subscription management
   - Account deletion

2. **Admin (Elevated)**
   - All user permissions
   - Admin dashboard access
   - User management
   - System configuration

### Permission Matrix

| Feature | User | Admin | Description |
|---------|------|-------|-------------|
| Personal Dashboard | ✅ | ✅ | View personal data |
| Profile Settings | ✅ | ✅ | Update own information |
| Subscription Management | ✅ | ✅ | Manage own subscription |
| Account Deletion | ✅ | ✅ | Delete own account |
| Admin Dashboard | ❌ | ✅ | System overview |
| User Management | ❌ | ✅ | CRUD operations on users |
| Role Management | ❌ | ✅ | Change user roles |
| System Settings | ❌ | ✅ | Configure application |

## User Registration

### Registration Process

1. **Form Submission** - User fills registration form
2. **Validation** - Input validation and duplicate check
3. **Password Hashing** - Secure password storage
4. **Database Creation** - User record created
5. **Auto-Login** - Automatic authentication
6. **Dashboard Redirect** - Redirect to user dashboard

### Registration API

Location: `app/api/auth/signup/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { name, email, password, organization } = await request.json();
  
  // Input validation
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'All fields are required' }, 
      { status: 400 }
    );
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Invalid email format' }, 
      { status: 400 }
    );
  }
  
  // Password strength validation
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' }, 
      { status: 400 }
    );
  }
  
  await connectDB();
  
  // Check for existing user
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return NextResponse.json(
      { error: 'User already exists' }, 
      { status: 400 }
    );
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    organization,
    role: 'user',
    notificationSettings: {
      emailNotifications: true,
      taskReminders: true,
      documentExpiration: true,
      systemUpdates: false,
      weeklyReports: true
    },
    securitySettings: {
      twoFactorEnabled: false,
      sessionTimeout: '24',
      passwordExpiry: '90',
      requirePasswordChange: false
    }
  });
  
  return NextResponse.json({ 
    message: 'User created successfully',
    userId: user._id 
  });
}
```

## Profile Management

### User Settings Interface

Location: `app/dashboard/settings/page.tsx`

Users can manage:

- **Personal Information** - Name, email, password
- **Organization Details** - Company information
- **Notification Preferences** - Email and alert settings
- **Security Settings** - Two-factor auth, session timeout
- **Account Deletion** - Self-service account removal

### Settings Categories

#### 1. Profile Settings
```typescript
const [userSettings, setUserSettings] = useState({
  name: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
```

#### 2. Organization Settings
```typescript
const [orgSettings, setOrgSettings] = useState({
  name: '',
  type: 'medical',
  address: '',
  phone: '',
  website: '',
  description: ''
});
```

#### 3. Notification Settings
```typescript
const [notificationSettings, setNotificationSettings] = useState({
  emailNotifications: true,
  taskReminders: true,
  documentExpiration: true,
  systemUpdates: false,
  weeklyReports: true
});
```

#### 4. Security Settings
```typescript
const [securitySettings, setSecuritySettings] = useState({
  twoFactorEnabled: false,
  sessionTimeout: '24',
  passwordExpiry: '90',
  requirePasswordChange: false
});
```

## Admin User Management

### Admin Dashboard

Location: `app/admin/page.tsx`

The admin dashboard provides:

- **User Statistics** - Total users, admins, active subscriptions
- **User List** - Comprehensive user table with actions
- **Search and Filter** - Find users quickly
- **Bulk Operations** - Mass user management

### Admin Features

#### 1. User Statistics Display
```typescript
const stats = [
  {
    title: "Total Users",
    value: users.length.toString(),
    icon: Users,
    color: "text-blue-600"
  },
  {
    title: "Admins",
    value: users.filter(u => u.role === 'admin').length.toString(),
    icon: Shield,
    color: "text-green-600"
  },
  {
    title: "Active Subscriptions",
    value: users.filter(u => u.subscription?.status === 'active').length.toString(),
    icon: CreditCard,
    color: "text-purple-600"
  },
  {
    title: "Trial Users",
    value: users.filter(u => u.subscription?.status === 'trialing').length.toString(),
    icon: Clock,
    color: "text-orange-600"
  }
];
```

#### 2. User Management Table
Features include:
- **User Information** - Name, email, role, organization
- **Subscription Status** - Plan and billing status
- **Account Actions** - Edit role, delete account
- **Safety Checks** - Prevent admin lockout

#### 3. Role Management
```typescript
const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    
    if (response.ok) {
      toast.success('User role updated successfully');
      fetchUsers(); // Refresh user list
    } else {
      const error = await response.json();
      toast.error(error.error || 'Failed to update role');
    }
  } catch (error) {
    toast.error('Failed to update user role');
  }
};
```

## Role Management System

### Role Update API

Location: `app/api/admin/users/[id]/role/route.ts`

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin authorization required
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' }, 
        { status: 403 }
      );
    }
    
    const { role } = await request.json();
    const userId = params.id;
    
    // Validate role value
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' }, 
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Find target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Prevent self-demotion
    if (targetUser.email === session.user.email && role === 'user') {
      return NextResponse.json(
        { error: 'Cannot demote yourself' }, 
        { status: 400 }
      );
    }
    
    // Check for last admin protection
    if (targetUser.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last admin user' }, 
          { status: 400 }
        );
      }
    }
    
    // Update role
    await User.findByIdAndUpdate(userId, { role });
    
    return NextResponse.json({ message: 'Role updated successfully' });
    
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

### Bootstrap Admin Creation

For initial admin setup, users can upgrade their role using special codes:

Location: `app/api/auth/upgrade-role/route.ts`

```typescript
const validUpgradeCodes = ['FIRST_ADMIN_2024', 'BOOTSTRAP_ADMIN'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { upgradeCode } = await request.json();
    
    // Validate upgrade code
    if (!validUpgradeCodes.includes(upgradeCode)) {
      return NextResponse.json(
        { error: 'Invalid upgrade code' }, 
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Update user role
    await User.findOneAndUpdate(
      { email: session.user.email },
      { role: 'admin' }
    );
    
    return NextResponse.json({ message: 'Role upgraded successfully' });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

## Account Deletion

### Self-Deletion Process

Users can delete their own accounts through the settings page:

1. **Navigate to Security Settings**
2. **Click "Delete My Account"**
3. **Confirm with password** (if applicable)
4. **Type "DELETE" to confirm**
5. **Account and data permanently removed**

### Deletion Safety Checks

```typescript
// Prevent admin self-deletion if last admin
if (user.role === 'admin') {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount <= 1) {
    return NextResponse.json(
      { error: 'Cannot delete account. You are the last administrator.' }, 
      { status: 400 }
    );
  }
}

// Verify password for security
if (user.password && password) {
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return NextResponse.json(
      { error: 'Invalid password' }, 
      { status: 400 }
    );
  }
}

// Require explicit confirmation
if (confirmDelete !== 'DELETE') {
  return NextResponse.json(
    { error: 'Account deletion must be confirmed by typing "DELETE"' }, 
    { status: 400 }
  );
}
```

### Admin User Deletion

Admins can delete other user accounts with additional safeguards:

```typescript
// Prevent admin from deleting themselves
if (userToDelete.email === session.user.email) {
  return NextResponse.json(
    { message: 'You cannot delete your own account' },
    { status: 400 }
  );
}

// Prevent deletion of last admin
const adminCount = await User.countDocuments({ role: 'admin' });
if (userToDelete.role === 'admin' && adminCount <= 1) {
  return NextResponse.json(
    { message: 'Cannot delete the last admin user' },
    { status: 400 }
  );
}
```

## Data Cleanup

### Stripe Integration

When accounts are deleted, associated Stripe data is automatically cleaned up:

```typescript
// Cancel active subscriptions
if (user.stripeCustomerId) {
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'active',
  });
  
  for (const subscription of subscriptions.data) {
    await stripe.subscriptions.cancel(subscription.id);
  }
  
  // Delete customer
  await stripe.customers.del(user.stripeCustomerId);
}
```

### Session Cleanup

After account deletion:
- User is automatically signed out
- All active sessions are invalidated
- JWT tokens become invalid

## User Search and Filtering

### Admin Dashboard Search

```typescript
const filteredUsers = users.filter(user => {
  const searchTerm = searchQuery.toLowerCase();
  return (
    user.name.toLowerCase().includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm) ||
    user.organization?.toLowerCase().includes(searchTerm)
  );
});
```

### Filter Options

- **By Role** - Admin, User
- **By Subscription Status** - Active, Trial, Canceled
- **By Organization** - Company-based filtering
- **By Registration Date** - Time-based filtering

## Security Considerations

### Access Control

1. **Authentication Required** - All user operations require valid session
2. **Role Verification** - Admin operations verify admin role
3. **Self-Service Limits** - Users can only modify their own data
4. **Admin Safeguards** - Prevent admin lockout scenarios

### Data Protection

1. **Password Hashing** - Bcrypt with 12 rounds
2. **Input Validation** - All inputs sanitized
3. **SQL Injection Prevention** - Parameterized queries
4. **XSS Protection** - Input escaping

### Audit Trail

- All user modifications logged
- Admin actions tracked
- Failed authentication attempts recorded
- Suspicious activity detection

## Troubleshooting

### Staff Panel Access Issues

**Problem: "Access Restricted" Message Despite Admin Role**

**Common Symptoms:**
- Database shows user role as "admin"
- Session shows role as "undefined" or "user"
- Staff management page shows access denied

**Root Causes & Solutions:**

#### 1. Session Role Mismatch (Most Common)

**Issue:** JWT token doesn't contain updated role information

**Solutions:**
```typescript
// Option A: Force session refresh
await update({ trigger: 'update' });
window.location.reload();

// Option B: Complete sign out/in
// Sign out completely and sign back in
```

#### 2. OAuth User Role Issues

**Issue:** Google/GitHub users created without proper role data in JWT

**Solutions:**
- Use debug tools on `/dashboard/staff` page
- Check both session role and database role
- Click "Force Refresh" if roles don't match

#### 3. Database Query Issues

**Issue:** System using OAuth provider ID instead of MongoDB ObjectId

**Fixed In:** Recent updates use email-based lookups instead of ID-based lookups

#### 4. Missing Role Upgrade

**Issue:** User account never upgraded to admin

**Solution:**
1. Go to `/dashboard/settings`
2. Find "Upgrade to Administrator" section
3. Use code: `FIRST_ADMIN_2024`, `BOOTSTRAP_ADMIN`, or `COMPLIANCE_ADMIN`
4. Click upgrade button
5. Wait for automatic page refresh

### Debug Tools Available

#### Debug API Endpoints

**Check Current User Data:**
```bash
GET /api/auth/me
```
Returns both session data and fresh database data for comparison.

**Force Session Refresh:**
```bash
POST /api/auth/refresh-session
```
Forces session refresh from database.

#### Debug Information Panel

Visit `/dashboard/staff` to see debug panel with:
- Session existence check
- Current session role
- Database role (after clicking "Check DB Role")
- Role match status
- Refresh buttons for testing

### Recent Fixes (2025)

#### Enhanced JWT Callbacks

**Fixed:** Session not updating after role upgrades

```typescript
// JWT callback now handles session updates
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

#### OAuth Role Population

**Fixed:** OAuth users created without role information

```typescript
// Sign-in callback now populates role data
async signIn({ user, account }) {
  if (account?.provider === 'google') {
    const existingUser = await User.findOne({ email: user.email });
    if (existingUser) {
      user.role = existingUser.role;
    } else {
      // Create with default role
      user.role = 'user';
    }
  }
  return true;
}
```

#### Database Lookup Improvements

**Fixed:** CastError when using OAuth provider IDs

- Changed from ID-based to email-based database lookups
- Eliminates ObjectId casting errors for OAuth users
- Provides consistent user identification across providers

---

**Next: Learn about [Payment Integration](./09-payment-integration.md) with Stripe!**
