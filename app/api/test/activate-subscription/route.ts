import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/organization-utils';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { forceActivate } = await request.json();

    await connectDB();
    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (forceActivate) {
      // Manually activate subscription for testing
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const updatedUser = await User.findOneAndUpdate(
        { 
          email: authResult.user?.email,
          organization: authResult.organization 
        },
        {
          subscription: {
            id: `sub_test_${Date.now()}`,
            status: 'active',
            plan: 'healthcare_compliance',
            currentPeriodStart: now,
            currentPeriodEnd: endDate,
          },
          $unset: { trialEndsAt: 1 }, // Clear trial date
        },
        { new: true }
      );

      console.log('🔧 Manually activated subscription for:', authResult.user?.email);
      
      return NextResponse.json({
        message: 'Subscription activated successfully',
        subscription: updatedUser?.subscription,
        debug: {
          oldTrialEndsAt: user.trialEndsAt,
          newSubscription: updatedUser?.subscription
        }
      });
    }

    // Just return current status
    return NextResponse.json({
      user: {
        email: user.email,
        subscription: user.subscription,
        trialEndsAt: user.trialEndsAt,
      },
      status: user.subscription?.status || 'no_subscription',
      isTrialing: user.trialEndsAt && user.trialEndsAt > new Date(),
    });

  } catch (error) {
    console.error('Manual subscription update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

