import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';
import crypto from 'crypto';
import { requireAdminWithOrganization } from '@/lib/organization-utils';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();
    ensureModelsRegistered();

    const User = getModel('User');
    const Invitation = getModel('Invitation');

    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json({
        error: 'Name, email, and role are required'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        error: 'User with this email already exists'
      }, { status: 400 });
    }

    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({ 
      email, 
      organization: authResult.organization?.id,
      status: 'pending'
    });

    if (existingInvitation) {
      return NextResponse.json({
        error: 'Pending invitation already exists for this email'
      }, { status: 400 });
    }

    // Get current user for invitedBy field
    const organizationId = typeof authResult.organization === 'object' 
      ? authResult.organization.id 
      : authResult.organization;
      
    const currentUser = await User.findOne({ 
      email: authResult.user?.email,
      organization: organizationId 
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const invitation = new Invitation({
      email,
      name,
      role,
      organization: authResult.organization?.id,
      token,
      invitedBy: currentUser._id,
    });

    await invitation.save();

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/auth/invite?token=${token}`;

    // Send invitation email
    try {
      const organizationName = typeof authResult.organization === 'object' 
        ? authResult.organization.name 
        : 'Your Organization';
      
      await sendInvitationEmail(
        email,
        name,
        organizationName,
        role,
        currentUser.name,
        invitationLink,
        invitation.expiresAt
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue with response even if email fails
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        invitationLink
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get all pending invitations for the organization
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();
    ensureModelsRegistered();

    const Invitation = getModel('Invitation');

    const invitations = await Invitation.find({
      organization: authResult.organization?.id,
      status: 'pending'
    })
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}


