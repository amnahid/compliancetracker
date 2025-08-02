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

    const { role } = await request.json();
    const { id: userId } = await params;

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update the user within the same organization
    const user = await User.findOne({
      _id: userId,
      organization: authResult.organization
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admin from demoting themselves to avoid lockout
    if (user.email === authResult.user?.email && role === 'user') {
      return NextResponse.json(
        { message: 'You cannot remove your own admin privileges' },
        { status: 400 }
      );
    }

    user.role = role;
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ 
      message: `User role updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
