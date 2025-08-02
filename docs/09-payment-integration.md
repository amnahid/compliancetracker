# 💳 Payment Integration with Stripe

## Overview

The Healthcare Compliance Application integrates with **Stripe** for secure payment processing, subscription management, and billing automation. This system handles recurring subscriptions, one-time payments, and automatic billing updates.

## Stripe Architecture

### Key Components

1. **Stripe Customer** - Represents a user in Stripe
2. **Stripe Subscription** - Recurring billing plan
3. **Stripe Product** - Service being sold
4. **Stripe Price** - Pricing model for products
5. **Stripe Webhook** - Real-time payment notifications

### Data Flow

```
User subscribes → Stripe Checkout → Payment processed → Webhook fired → Database updated
```

## Stripe Configuration

### Environment Variables

Required Stripe configuration in `.env.local`:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App URLs
NEXTAUTH_URL=http://localhost:3000
```

### Stripe Client Setup

Location: `lib/stripe.ts`

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export default stripe;
```

## User-Stripe Integration

### Customer Creation

When a user signs up, a Stripe customer is created:

```typescript
// During user registration or first subscription
const customer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: {
    userId: user._id.toString(),
    organization: user.organization || ''
  }
});

// Store customer ID in user record
await User.findByIdAndUpdate(user._id, {
  stripeCustomerId: customer.id
});
```

### Customer Linking

The user database record links to Stripe:

```typescript
// User Model Schema
const UserSchema = new Schema({
  // ... other fields
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true
  },
  subscription: {
    id: String,
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid']
    },
    plan: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialStart: Date,
    trialEnd: Date
  }
});
```

## Subscription Management

### Creating Checkout Session

Location: `app/api/stripe/create-checkout-session/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json();

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      
      // Update user with customer ID
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        userId: user._id.toString(),
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### Frontend Checkout Integration

```typescript
// In a React component
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const handleSubscribe = async (priceId: string) => {
  try {
    // Create checkout session
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const { sessionId } = await response.json();

    // Redirect to Stripe checkout
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
  } catch (error) {
    console.error('Checkout error:', error);
  }
};
```

## Webhook Handling

### Webhook Endpoint

Location: `app/api/stripe/webhook/route.ts`

This endpoint handles real-time events from Stripe:

```typescript
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### Webhook Event Handlers

#### Checkout Session Completed

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Update user record
  await User.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0].price.nickname || 'Unknown',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start 
          ? new Date(subscription.trial_start * 1000) 
          : undefined,
        trialEnd: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000) 
          : undefined,
      }
    }
  );
}
```

#### Subscription Updated

```typescript
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await User.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0].price.nickname || 'Unknown',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start 
          ? new Date(subscription.trial_start * 1000) 
          : undefined,
        trialEnd: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000) 
          : undefined,
      }
    }
  );
}
```

#### Subscription Deleted

```typescript
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await User.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      $unset: { subscription: 1 }
    }
  );
}
```

## Subscription Status Management

### Status Types

- **active** - Subscription is current and paid
- **trialing** - In free trial period
- **past_due** - Payment failed, grace period
- **canceled** - Subscription ended
- **unpaid** - Payment failed, no grace period

### Status-Based Access Control

```typescript
// Middleware or API route check
const hasActiveSubscription = (user: IUser) => {
  return user.subscription && 
         ['active', 'trialing'].includes(user.subscription.status);
};

// Usage in protected routes
if (!hasActiveSubscription(user)) {
  return NextResponse.json(
    { error: 'Active subscription required' },
    { status: 403 }
  );
}
```

### Trial Period Management

```typescript
// Check if user is in trial
const isInTrial = (user: IUser) => {
  if (!user.subscription || user.subscription.status !== 'trialing') {
    return false;
  }
  
  if (!user.subscription.trialEnd) {
    return false;
  }
  
  return new Date() < user.subscription.trialEnd;
};

// Calculate trial days remaining
const getTrialDaysRemaining = (user: IUser) => {
  if (!isInTrial(user) || !user.subscription?.trialEnd) {
    return 0;
  }
  
  const today = new Date();
  const trialEnd = user.subscription.trialEnd;
  const diffTime = trialEnd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};
```

## Payment Cleanup on Account Deletion

### Automatic Subscription Cancellation

When a user account is deleted, all Stripe data is automatically cleaned up:

```typescript
// In account deletion API
if (user.stripeCustomerId) {
  try {
    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
    });

    // Cancel all active subscriptions
    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
    }

    // Delete the customer from Stripe
    await stripe.customers.del(user.stripeCustomerId);
  } catch (stripeError) {
    console.error('Error cleaning up Stripe data:', stripeError);
    // Continue with account deletion even if Stripe cleanup fails
  }
}
```

### Refund Handling

```typescript
// Partial refund for unused subscription time
const calculateProRatedRefund = (subscription: Stripe.Subscription) => {
  const currentPeriodStart = subscription.current_period_start * 1000;
  const currentPeriodEnd = subscription.current_period_end * 1000;
  const now = Date.now();
  
  const totalPeriod = currentPeriodEnd - currentPeriodStart;
  const remainingPeriod = currentPeriodEnd - now;
  const usageRatio = remainingPeriod / totalPeriod;
  
  return Math.max(0, usageRatio);
};
```

## Error Handling

### Payment Failures

```typescript
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Update user status
  await User.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      'subscription.status': 'past_due'
    }
  );
  
  // Send notification email
  await sendPaymentFailedEmail(customerId);
}
```

### Webhook Retry Logic

Stripe automatically retries failed webhooks with exponential backoff. Handle idempotency:

```typescript
// Use Stripe event ID for idempotency
const processedEvents = new Set();

if (processedEvents.has(event.id)) {
  return NextResponse.json({ received: true });
}

// Process event
await handleEvent(event);

// Mark as processed
processedEvents.add(event.id);
```

## Testing Stripe Integration

### Test Mode Setup

1. Use Stripe test keys in development
2. Test webhook endpoints with Stripe CLI
3. Use test card numbers for payments

### Test Card Numbers

```typescript
// Stripe test cards
const testCards = {
  success: '4242424242424242',
  declined: '4000000000000002',
  requiresAuth: '4000002500003155',
  insufficient: '4000000000009995'
};
```

### Local Webhook Testing

```bash
# Install Stripe CLI
stripe login

# Forward events to local endpoint
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

## Security Considerations

### Webhook Security

1. **Signature Verification** - Always verify webhook signatures
2. **HTTPS Only** - Webhooks must use HTTPS in production
3. **Idempotency** - Handle duplicate events gracefully
4. **Rate Limiting** - Protect webhook endpoints

### Customer Data Protection

1. **PCI Compliance** - Never store card details
2. **Data Encryption** - Encrypt sensitive data in transit
3. **Access Control** - Restrict Stripe dashboard access
4. **Audit Logging** - Log all payment operations

### API Key Management

1. **Environment Variables** - Store keys securely
2. **Key Rotation** - Regularly rotate API keys
3. **Restricted Keys** - Use minimum required permissions
4. **Development vs Production** - Separate key sets

## Monitoring and Analytics

### Payment Metrics

Track important payment metrics:

- Subscription conversion rate
- Churn rate
- Monthly recurring revenue (MRR)
- Failed payment rate
- Trial conversion rate

### Stripe Dashboard

Monitor payments through:

- Stripe Dashboard analytics
- Custom reporting queries
- Webhook event logs
- Customer support tools

---

**Next: Learn about the [Admin Dashboard](./10-admin-dashboard.md) features!**
