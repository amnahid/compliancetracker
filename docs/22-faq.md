# ❓ Frequently Asked Questions (FAQ)

## General Questions

### What is the Healthcare Compliance Application?

The Healthcare Compliance Application is a modern web application built with Next.js that helps healthcare organizations manage user accounts, compliance requirements, and administrative tasks. It features role-based access control, payment processing, and comprehensive user management tools.

### Who can use this application?

- **Healthcare Organizations** - Manage compliance and user accounts
- **IT Administrators** - Oversee system configuration and user management
- **Healthcare Staff** - Access personalized dashboards and tools
- **Developers** - Extend and customize the application

### What technologies does it use?

- **Frontend**: Next.js 13+, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MongoDB with Mongoose
- **Payments**: Stripe integration
- **Deployment**: Vercel (recommended)

## Setup and Installation

### How do I get started quickly?

1. Follow the [Quick Start Guide](./01-quick-start.md)
2. Clone the repository and install dependencies
3. Set up environment variables
4. Run `npm run dev`
5. Create your first admin account using upgrade codes

### What environment variables do I need?

**Required for basic functionality:**
```env
MONGODB_URI=mongodb://localhost:27017/healthcare-compliance
NEXTAUTH_SECRET=your-secret-key-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000
```

**Optional for full features:**
```env
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_USER=your-email@gmail.com
```

### How do I set up MongoDB?

**Local MongoDB:**
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/healthcare-compliance`

**MongoDB Atlas (Cloud):**
1. Create account at mongodb.com
2. Create cluster and database
3. Get connection string
4. Use in `MONGODB_URI`

### How do I become an admin?

1. Create a regular user account
2. Go to Settings page
3. Find "Upgrade to Administrator" section
4. Use code: `FIRST_ADMIN_2024` or `BOOTSTRAP_ADMIN`
5. Submit and refresh the page

## Authentication and Users

### How does authentication work?

The app uses **NextAuth.js** for secure authentication:
- Session-based authentication with JWT tokens
- Password hashing with bcrypt
- Role-based access control (User/Admin)
- Built-in CSRF protection

### What are the user roles?

**User (Default):**
- Personal dashboard access
- Profile management
- Subscription management
- Account deletion

**Admin (Elevated):**
- All user permissions
- Admin dashboard access
- User management (CRUD operations)
- Role assignment
- System statistics

### Can I change user roles?

**Yes, if you're an admin:**
1. Go to Admin Dashboard (`/admin`)
2. Find the user in the table
3. Click the role badge
4. Select new role
5. Confirm the change

**Safety features:**
- Cannot demote yourself
- Cannot demote the last admin
- Changes are logged

### Why can't I access the Staff Panel?

**If you see "Access Restricted" for Staff Management:**

**Problem 1: Role Not Updated in Session**
- Database shows "admin" but session shows "user" or "undefined"
- **Solution**: Click "Force Refresh" button on staff page or sign out/in

**Problem 2: Not Actually Admin**
- Need to upgrade to admin role first
- **Solution**: Go to Settings → Use code `FIRST_ADMIN_2024`

**Problem 3: OAuth User Role Issue**
- Google/GitHub users sometimes have session/database role mismatch
- **Solution**: Use debug tools on staff page to check both session and database role

**Quick Debug Steps:**
1. Go to `/dashboard/staff`
2. Look at debug information panel
3. Check if "DB Role" shows "admin"
4. If yes but "Session Role" is different, click "Force Refresh"
5. If no, go to Settings and upgrade role

### How do I delete a user account?

**Self-deletion:**
1. Go to Settings → Security
2. Click "Delete My Account"
3. Enter password (if applicable)
4. Type "DELETE" to confirm
5. Account is permanently removed

**Admin deletion:**
1. Go to Admin Dashboard
2. Find user in table
3. Click delete button
4. Confirm deletion

**What gets deleted:**
- User account and data
- Stripe subscriptions (automatically canceled)
- All associated files
- Session data

### Why can't I access the admin dashboard?

**Possible reasons:**
1. **Not an admin** - Use upgrade code to become admin
2. **Not logged in** - Sign in first
3. **Session expired** - Sign out and back in
4. **Wrong URL** - Use `/admin` exactly

### How do I reset a password?

Currently, password reset is not implemented. Users can:
1. Update password in Settings if logged in
2. Contact admin for manual reset
3. Create new account if necessary

## Payments and Subscriptions

### How does billing work?

The app integrates with **Stripe** for payments:
- Secure payment processing
- Recurring subscription billing
- Automatic invoice generation
- Real-time payment status updates

### What happens when I delete an account with a subscription?

**Automatic cleanup:**
1. All active subscriptions are canceled
2. Stripe customer record is deleted
3. No further billing occurs
4. User account is permanently removed

### How do I change subscription plans?

Currently, plan changes must be handled through:
1. Canceling current subscription
2. Starting new subscription
3. Or contacting support for manual change

### What payment methods are accepted?

Stripe supports:
- Credit cards (Visa, MasterCard, Amex, etc.)
- Debit cards
- Digital wallets (Apple Pay, Google Pay)
- Bank transfers (in some regions)

### How do I handle failed payments?

**Automatic handling:**
1. Stripe retries failed payments
2. Customer receives email notifications
3. Subscription enters "past_due" status
4. Grace period provided before cancellation

**Manual resolution:**
1. Update payment method in Stripe
2. Retry payment manually
3. Contact customer support

## Technical Issues

### The app won't start. What should I check?

**Common issues:**

1. **Missing dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   - Check `.env.local` exists
   - Verify all required variables are set
   - Restart server after changes

3. **Database connection:**
   - Ensure MongoDB is running
   - Check connection string
   - Verify database permissions

4. **Port conflicts:**
   ```bash
   npx kill-port 3000
   npm run dev
   ```

### I'm getting authentication errors. How do I fix them?

**Check these:**

1. **NEXTAUTH_SECRET** is set and at least 32 characters
2. **NEXTAUTH_URL** matches your domain exactly
3. Database connection is working
4. Clear browser cookies and try again
5. Restart the development server

### The admin dashboard shows no data. Why?

**Possible causes:**

1. **Database is empty** - Create some users first
2. **Not an admin** - Verify your role with upgrade code
3. **Database connection issues** - Check MongoDB connection
4. **API errors** - Check browser console for errors

### Stripe payments aren't working. What should I check?

**Verification steps:**

1. **API keys are correct** - Test vs production keys
2. **Webhook endpoint is configured** in Stripe dashboard
3. **HTTPS required** for production webhooks
4. **Check Stripe dashboard** for payment attempts
5. **Verify webhook signatures** are validating correctly

### How do I debug API issues?

**Debugging tools:**

1. **Browser DevTools** - Check Network tab
2. **Server logs** - Check terminal output
3. **Database queries** - Verify data exists
4. **API testing** - Use Postman or curl
5. **Error boundaries** - Check React error messages

### The application is slow. How can I optimize it?

**Performance tips:**

1. **Database indexing** - Add indexes for common queries
2. **Image optimization** - Use Next.js Image component
3. **Caching** - Implement Redis or memory caching
4. **Bundle analysis** - Use `npm run analyze`
5. **Database connection pooling** - Optimize MongoDB connections

## Development

### How do I add new features?

**Development workflow:**

1. **Plan the feature** - Define requirements
2. **Create database models** - Update schemas if needed
3. **Build API endpoints** - Add to `/api` directory
4. **Create UI components** - Add to `/components`
5. **Add pages** - Create in `/app` directory
6. **Test thoroughly** - Manual and automated testing
7. **Update documentation** - Keep docs current

### Can I customize the UI?

**Yes! The UI is highly customizable:**

1. **Tailwind CSS** - Modify utility classes
2. **Shadcn/ui components** - Customize base components
3. **Theme system** - Add dark/light mode
4. **Custom components** - Create new components
5. **Layout changes** - Modify page layouts

### How do I add new user roles?

**Steps to add roles:**

1. **Update User model** - Add role to enum
2. **Modify authentication** - Update role checks
3. **Add permission logic** - Define role capabilities
4. **Update UI** - Add role-specific elements
5. **Test thoroughly** - Verify all access controls

### Can I use a different database?

**Currently supports MongoDB only**, but you can adapt for:

1. **PostgreSQL** - Replace Mongoose with Prisma
2. **MySQL** - Use appropriate ORM
3. **SQLite** - For development/testing
4. **Firebase** - Cloud database option

**Note:** Requires significant code changes.

### How do I deploy to production?

**Recommended: Vercel deployment**

1. **Connect GitHub** repository to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Configure domain** (optional)
4. **Deploy automatically** on git push

**Alternative: Manual deployment**

1. **Build the application** - `npm run build`
2. **Set up server** - Node.js environment
3. **Configure environment** - Production variables
4. **Start application** - `npm start`

## Security

### Is the application secure?

**Security features implemented:**

1. **Password hashing** - Bcrypt with 12 rounds
2. **Session management** - Secure JWT tokens
3. **CSRF protection** - NextAuth.js built-in
4. **Input validation** - All inputs sanitized
5. **SQL injection prevention** - Parameterized queries
6. **XSS protection** - Input escaping
7. **HTTPS enforced** - In production
8. **Security headers** - Comprehensive set

### How do I keep the application secure?

**Security best practices:**

1. **Regular updates** - Keep dependencies current
2. **Environment variables** - Never commit secrets
3. **Access control** - Implement least privilege
4. **Monitor logs** - Watch for suspicious activity
5. **Backup data** - Regular database backups
6. **Security audits** - Regular code reviews

### What about HIPAA compliance?

**For HIPAA compliance, ensure:**

1. **Data encryption** - In transit and at rest
2. **Access controls** - Proper user management
3. **Audit logging** - Track all data access
4. **Business Associate Agreements** - With vendors
5. **Regular assessments** - Security reviews
6. **Staff training** - HIPAA awareness

**Note:** This application provides tools but doesn't guarantee HIPAA compliance. Consult with compliance experts.

## Support

### Where can I get help?

1. **Documentation** - Start with this guide
2. **GitHub Issues** - Report bugs and feature requests
3. **Community Forums** - Ask questions and share solutions
4. **Email Support** - Contact the development team

### How do I report a bug?

**When reporting bugs, include:**

1. **Steps to reproduce** - Exact sequence of actions
2. **Expected behavior** - What should happen
3. **Actual behavior** - What actually happens
4. **Environment details** - OS, browser, Node.js version
5. **Error messages** - Full error text and stack traces
6. **Screenshots** - If applicable

### How do I request a feature?

**Feature request process:**

1. **Check existing requests** - Avoid duplicates
2. **Describe the feature** - Clear explanation
3. **Explain the use case** - Why it's needed
4. **Provide examples** - How it would work
5. **Consider alternatives** - Other solutions

### Is there a community?

**Join the community:**

- **GitHub Discussions** - Ask questions and share ideas
- **Discord Server** - Real-time chat with other users
- **Stack Overflow** - Tag questions with project name
- **Twitter** - Follow for updates and announcements

---

**Still have questions? Check the [Troubleshooting Guide](./21-troubleshooting.md) or contact support!**
