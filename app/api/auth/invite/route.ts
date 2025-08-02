import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invitation from '@/lib/models/Invitation';

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


