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

    await connectDB();

    // Get fresh user data from database
    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization 
    }).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Session refresh successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });

  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


