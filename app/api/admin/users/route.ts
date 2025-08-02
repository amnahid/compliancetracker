import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAdminWithOrganization } from '@/lib/organization-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();

    // Get all users in the same organization for task assignment
    const users = await User.find({ 
      organization: authResult.organization?.id 
    }).select('-password').sort({ name: 1 });

    console.log(`Users API - Found ${users.length} users in organization: ${authResult.organization}`);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { message: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user (they'll need to set password via signup)
    const newUser = new User({
      name,
      email,
      role,
      organization: authResult.organization?.id,
      emailVerified: null, // They need to verify via signup
    });

    await newUser.save();

    // Return user without password
    const { password, ...userWithoutPassword } = newUser.toObject();
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

