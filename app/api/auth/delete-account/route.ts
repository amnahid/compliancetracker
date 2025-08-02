import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/organization-utils';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { password, confirmDelete } = await request.json();

    // Require confirmation
    if (!confirmDelete || confirmDelete !== 'DELETE') {
      return NextResponse.json(
        { error: 'Account deletion must be confirmed by typing "DELETE"' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the current user
    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization 
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For admin users, check if they're the last admin in their organization
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ 
        role: 'admin',
        organization: authResult.organization 
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete account. You are the last administrator in your organization. Please promote another user to admin first.' },
          { status: 400 }
        );
      }
    }

    // If user has a password (not OAuth), verify it
    if (user.password && password) {
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 400 }
        );
      }
    }

    // Cancel Stripe subscription if exists
    if (user.stripeCustomerId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // Get active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
        });

        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
        }

        // Delete the customer
        await stripe.customers.del(user.stripeCustomerId);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with account deletion even if Stripe fails
      }
    }

    // Delete the user account
    await User.findByIdAndDelete(user._id);

    return NextResponse.json({ 
      message: 'Account successfully deleted' 
    }, { status: 200 });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


