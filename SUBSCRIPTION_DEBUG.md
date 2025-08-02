# 🔧 Subscription Upgrade Debugging Guide

## Problem: Paid plan isn't upgrading after payment

### 🕵️ Debug Steps

#### 1. Check Current User Status
Visit: `http://localhost:3000/api/debug/subscription`

This will show:
- Current subscription status
- Trial information  
- Stripe customer ID
- Recommendations

#### 2. Test Checkout Flow
1. Go to `/dashboard/billing`
2. Open browser dev tools (F12) → Network tab
3. Click "Upgrade Now"
4. Check API calls for errors

#### 3. Monitor Webhook Processing
Check server console logs when completing payment:
- Look for "🔄 Creating checkout session for user"
- Look for "🔄 Updating user subscription" 
- Look for "✅ User subscription updated"

#### 4. Verify Stripe Webhook Setup
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Check if webhook endpoint exists: `http://localhost:3000/api/stripe/webhook`
3. Required events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`

### 🔧 Common Issues & Fixes

#### Issue 1: Webhook Not Receiving Events
**Symptoms:** Payment succeeds but subscription status doesn't update

**Solution:** 
- Use ngrok for local development: `ngrok http 3000`
- Update webhook URL to ngrok URL
- Or test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

#### Issue 2: User Not Found in Webhook
**Symptoms:** Webhook runs but user isn't updated

**Debug:**
- Check if customer email matches user email
- Verify stripeCustomerId is set correctly

#### Issue 3: Frontend Not Refreshing
**Symptoms:** Payment succeeds, webhook updates user, but UI shows old status

**Solution:**
- The billing page now auto-refreshes after successful payment
- Manual refresh: Visit `/api/user/profile` to check latest status

### 🧪 Test Payment Flow

1. **Use Test Cards:**
   - Success: `4242 4242 4242 4242`
   - Any future expiry, any CVC

2. **Complete Flow Test:**
   ```
   Sign up → Trial starts → Go to billing → Upgrade → Pay → Check status
   ```

3. **Expected Results:**
   - Before payment: `subscription.status = 'trialing'`
   - After payment: `subscription.status = 'active'`
   - Trial fields cleared when active

### 📊 API Endpoints for Testing

- `GET /api/debug/subscription` - Debug current subscription status
- `GET /api/user/profile` - Get user data including subscription
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/webhook` - Handle Stripe events

### 🚨 Red Flags to Look For

1. **Console Errors:**
   - MongoDB connection issues
   - Stripe API errors
   - Webhook signature validation failures

2. **Network Errors:**
   - 500 errors on checkout session creation
   - Webhook endpoint returning errors

3. **Data Issues:**
   - User subscription object not updating
   - Trial dates not clearing after payment
   - Multiple subscription records

### 💡 Quick Fixes

If subscription still isn't updating after payment:

1. **Manual Database Update** (for testing):
   ```javascript
   // In MongoDB or via API
   user.subscription = {
     status: 'active',
     plan: 'healthcare_compliance',
     id: 'sub_test123',
     currentPeriodStart: new Date(),
     currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
   };
   ```

2. **Force Refresh Frontend:**
   - Hard refresh browser (Ctrl+F5)
   - Clear browser cache
   - Check `/api/user/profile` directly
