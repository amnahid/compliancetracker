import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/organization-utils';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();
    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Debug subscription status
    const debugInfo = {
      email: user.email,
      userId: user._id,
      organization: user.organization,
      stripeCustomerId: user.stripeCustomerId,
      subscription: user.subscription,
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscription?.status || 'none',
      isInTrial: user.trialEndsAt && user.trialEndsAt > new Date(),
      hasActiveSubscription: user.subscription?.status === 'active',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      message: 'Subscription debug info',
      debug: debugInfo,
      recommendations: {
        shouldShowUpgrade: !debugInfo.hasActiveSubscription,
        trialDaysRemaining: debugInfo.isInTrial && user.trialEndsAt 
          ? Math.ceil((user.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }
    });

  } catch (error) {
    console.error('Debug subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


