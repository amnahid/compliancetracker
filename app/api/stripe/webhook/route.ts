import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await connectDB();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Find user by email (from Stripe customer) for better reliability
        const customer = await stripe.customers.retrieve(session.customer as string);
        const customerEmail = typeof customer !== 'string' && !customer.deleted ? customer.email : null;

        if (customerEmail) {
          const updateData: any = {
            stripeCustomerId: session.customer,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              plan: session.metadata?.plan || process.env.DEFAULT_PLAN_NAME || 'healthcare_compliance',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
            },
          };

          // Clear trial end date when subscription becomes active
          if (subscription.status === 'active') {
            updateData.$unset = { trialEndsAt: 1 };
          }

          console.log('🔄 Updating user subscription:', {
            email: customerEmail,
            subscriptionStatus: subscription.status,
            plan: session.metadata?.plan,
            subscriptionId: subscription.id
          });

          const updatedUser = await User.findOneAndUpdate(
            { email: customerEmail },
            updateData,
            { new: true }
          );

          console.log('✅ User subscription updated:', updatedUser?.subscription);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        console.log('🔄 Processing invoice payment succeeded:', {
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          subscriptionStatus: subscription.status
        });

        const updatedUser = await User.findOneAndUpdate(
          { stripeCustomerId: invoice.customer },
          {
            'subscription.status': subscription.status,
            'subscription.currentPeriodStart': new Date(
              subscription.current_period_start * 1000
            ),
            'subscription.currentPeriodEnd': new Date(
              subscription.current_period_end * 1000
            ),
          },
          { new: true }
        );

        console.log('✅ User updated after payment:', updatedUser?.subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await User.findOneAndUpdate(
          { stripeCustomerId: subscription.customer },
          {
            $unset: { subscription: 1 },
          }
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
