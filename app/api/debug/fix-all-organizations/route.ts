import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Find users without organizations
    const usersWithoutOrg = await User.find({ 
      $or: [
        { organization: { $exists: false } },
        { organization: null },
        { organization: "" }
      ]
    });
    
    const updatedUsers = [];
    
    for (const user of usersWithoutOrg) {
      // Create organization based on email domain
      const emailDomain = user.email.split('@')[1];
      const organizationName = emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
      
      user.organization = organizationName;
      await user.save();
      
      updatedUsers.push({
        email: user.email,
        newOrganization: organizationName
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed organization for ${updatedUsers.length} users`,
      updatedUsers,
      totalUsersFixed: updatedUsers.length
    });

  } catch (error) {
    console.error('Error fixing organizations:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
