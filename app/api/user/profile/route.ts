import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { requireAuthWithOrganization } from '@/lib/organization-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectToDatabase();

    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization?.id 
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { name, email, currentPassword, newPassword } = await request.json();

    await connectToDatabase();

    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization?.id 
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update basic profile information
    if (name !== undefined) user.name = name;
    if (email !== undefined && email !== user.email) {
      // Check if new email already exists within the same organization
      const existingUser = await User.findOne({ 
        email,
        organization: authResult.organization?.id 
      });
      if (existingUser) {
        return NextResponse.json({ message: 'Email already in use' }, { status: 400 });
      }
      user.email = email;
    }

    // Handle password change
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ message: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
    }

    user.updatedAt = new Date();
    await user.save();

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

