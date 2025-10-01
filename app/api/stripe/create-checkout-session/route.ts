import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/organization-utils';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { plan = 'monthly' } = await request.json();

    // Map plan names to the correct price IDs
    const planToPriceId: Record<string, string> = {
      monthly: PRICE_IDS.healthcare_compliance_monthly,
      yearly: PRICE_IDS.healthcare_compliance_yearly,
      // Legacy support
      healthcare_compliance: PRICE_IDS.healthcare_compliance_monthly,
    };

    const priceId = planToPriceId[plan];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await connectDB();
    
    // Find user within the organization
    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId,
      });
    }

    // Check user's trial status
    const now = new Date();
    const isInTrial = user.trialEndsAt && user.trialEndsAt > now;
    const hasActiveSubscription = user.subscription?.status === 'active';

    // If user already has active subscription, redirect to billing
    if (hasActiveSubscription) {
      return NextResponse.json({ 
        error: 'User already has an active subscription',
        redirectUrl: '/dashboard/billing'
      }, { status: 400 });
    }

    // Calculate trial period days
    let trialPeriodDays = 0;
    
    if (isInTrial && user.trialEndsAt) {
      // User is in trial - calculate remaining days
      const trialDaysRemaining = Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      trialPeriodDays = Math.max(1, trialDaysRemaining); // Ensure minimum 1 day
    } else if (!user.trialEndsAt) {
      // New user who hasn't started trial yet - give full 14-day trial
      trialPeriodDays = 14;
    }
    // If trial has expired, trialPeriodDays remains 0 (no trial)

    const subscriptionData: any = {
      metadata: {
        userId: user._id.toString(),
        plan,
      },
    };

    // Only add trial period if it's greater than 0
    if (trialPeriodDays > 0) {
      subscriptionData.trial_period_days = trialPeriodDays;
    }

    console.log('🔄 Creating checkout session for user:', {
      email: authResult.user?.email,
      userId: user._id,
      organization: authResult.organization,
      isInTrial,
      hasActiveSubscription,
      trialPeriodDays,
      userTrialEndsAt: user.trialEndsAt,
      userSubscriptionStatus: user.subscription?.status
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        plan,
      },
      subscription_data: subscriptionData,
    });

    return NextResponse.json({ 
      url: checkoutSession.url,
      trialDays: trialPeriodDays,
      debug: {
        userTrialEndsAt: user.trialEndsAt,
        isInTrial,
        hasActiveSubscription
      }
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
