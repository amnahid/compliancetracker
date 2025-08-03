import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        error: 'Invitation token is required'
      }, { status: 400 });
    }

    await connectDB();
    ensureModelsRegistered();

    const Invitation = getModel('Invitation');
    const invitation = await Invitation.findOne({ 
      token,
      status: 'pending'
    })
    .populate('invitedBy', 'name email')
    .populate('organization', 'name');

    if (!invitation) {
      return NextResponse.json({
        error: 'Invalid or expired invitation'
      }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      
      return NextResponse.json({
        error: 'Invitation has expired'
      }, { status: 410 });
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        organization: invitation.organization?.name || 'Unknown Organization',
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (!token || !action) {
      return NextResponse.json({
        error: 'Token and action are required'
      }, { status: 400 });
    }

    await connectDB();
    ensureModelsRegistered();

    const Invitation = getModel('Invitation');
    const User = getModel('User');

    const invitation = await Invitation.findOne({ 
      token,
      status: 'pending'
    });

    if (!invitation) {
      return NextResponse.json({
        error: 'Invalid or expired invitation'
      }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await Invitation.findByIdAndUpdate(invitation._id, { 
        status: 'expired' 
      });
      return NextResponse.json({
        error: 'Invitation has expired'
      }, { status: 410 });
    }

    if (action === 'accept') {
      // Find user by email
      const user = await User.findOne({ email: invitation.email });
      
      if (!user) {
        return NextResponse.json({
          error: 'User not found'
        }, { status: 404 });
      }

      // Add user to organization with the specified role
      user.organizations.push({
        organization: invitation.organization,
        role: invitation.role,
        joinedAt: new Date()
      });

      await user.save();

      // Update invitation status
      await Invitation.findByIdAndUpdate(invitation._id, {
        status: 'accepted',
        acceptedAt: new Date()
      });

      return NextResponse.json({
        message: 'Invitation accepted successfully',
        organizationId: invitation.organization
      });

    } else if (action === 'decline') {
      await Invitation.findByIdAndUpdate(invitation._id, {
        status: 'declined',
        declinedAt: new Date()
      });

      return NextResponse.json({
        message: 'Invitation declined'
      });
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}


