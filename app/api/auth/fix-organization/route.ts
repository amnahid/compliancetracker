import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    // Don't use requireAuthWithOrganization since we're fixing missing organizations
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Find the user in the database
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user doesn't have an organization, create one based on their email domain
    if (!user.organization) {
      const emailDomain = session.user.email.split('@')[1];
      const organizationName = emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
      
      user.organization = organizationName;
      await user.save();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Organization created and assigned successfully',
        organization: user.organization,
        user: {
          email: user.email,
          role: user.role,
          organization: user.organization
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Organization already exists',
      organization: user.organization,
      user: {
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });

  } catch (error) {
    console.error('Fix organization error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


