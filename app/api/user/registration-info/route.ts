import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/organization-utils';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();

    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization 
    });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const registrationInfo = {
      provider: user.provider || 'credentials',
      hasPassword: !!user.password,
      emailVerified: !!user.emailVerified,
      createdAt: user.createdAt,
      registrationMethod: getRegistrationMethodDescription(user.provider),
      canChangePassword: user.provider === 'credentials',
      authenticationMethods: getAvailableAuthMethods(user)
    };

    return NextResponse.json(registrationInfo);

  } catch (error) {
    console.error('Error fetching registration info:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRegistrationMethodDescription(provider?: string): string {
  switch (provider) {
    case 'google':
      return 'Registered with Google account';
    case 'github':
      return 'Registered with GitHub account';
    case 'credentials':
    default:
      return 'Registered with email and password';
  }
}

function getAvailableAuthMethods(user: any): string[] {
  const methods = [];
  
  if (user.provider === 'credentials') {
    methods.push('Email & Password');
  }
  
  if (user.provider === 'google') {
    methods.push('Google OAuth');
  }
  
  if (user.provider === 'github') {
    methods.push('GitHub OAuth');
  }

  return methods;
}


