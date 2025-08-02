import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { requireAuthWithOrganization } from '@/lib/organization-utils';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const securitySettings = await request.json();

    await connectToDatabase();

    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization?.id 
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update security preferences
    user.securitySettings = {
      twoFactorEnabled: securitySettings.twoFactorEnabled ?? false,
      sessionTimeout: securitySettings.sessionTimeout ?? '24',
      passwordExpiry: securitySettings.passwordExpiry ?? '90',
      requirePasswordChange: securitySettings.requirePasswordChange ?? false,
    };

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ 
      message: 'Security settings updated successfully',
      securitySettings: user.securitySettings 
    });

  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json({ 
      securitySettings: user.securitySettings || {
        twoFactorEnabled: false,
        sessionTimeout: '24',
        passwordExpiry: '90',
        requirePasswordChange: false,
      }
    });

  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


