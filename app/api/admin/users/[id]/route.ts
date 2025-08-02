import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAdminWithOrganization } from '@/lib/organization-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { message: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user to be updated within the same organization
    const userToUpdate = await User.findOne({
      _id: userId,
      organization: authResult.organization?.id
    });
    
    if (!userToUpdate) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (email !== userToUpdate.email) {
      const existingUser = await User.findOne({ 
        email: email,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { message: 'Email already in use by another user' },
          { status: 400 }
        );
      }
    }

    // If changing role from admin to user, check if this is the last admin
    if (userToUpdate.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ 
        role: 'admin',
        organization: authResult.organization?.id 
      });
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { message: 'Cannot remove admin role from the last admin user in the organization' },
          { status: 400 }
        );
      }
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, role },
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: userId } = await params;

    await connectDB();

    // Find the user to be deleted within the same organization
    const userToDelete = await User.findOne({
      _id: userId,
      organization: authResult.organization?.id
    });
    
    if (!userToDelete) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (userToDelete.email === authResult.user?.email) {
      return NextResponse.json(
        { message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if this is the last admin user in the organization
    const adminCount = await User.countDocuments({ 
      role: 'admin',
      organization: authResult.organization?.id 
    });
    
    if (userToDelete.role === 'admin' && adminCount <= 1) {
      return NextResponse.json(
        { message: 'Cannot delete the last admin user in the organization' },
        { status: 400 }
      );
    }

    // Cancel Stripe subscription if exists
    if (userToDelete.stripeCustomerId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // Get active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: userToDelete.stripeCustomerId,
          status: 'active',
        });

        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
        }

        // Delete the customer
        await stripe.customers.del(userToDelete.stripeCustomerId);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with account deletion even if Stripe fails
      }
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ 
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
