import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Find users without organizations
    const usersWithoutOrg = await User.find({ 
      $or: [
        { organization: { $exists: false } },
        { organization: null },
        { organization: "" }
      ]
    }).select('email name organization role');
    
    // Find all users
    const allUsers = await User.find({}).select('email name organization role');
    
    return NextResponse.json({
      success: true,
      usersWithoutOrganization: usersWithoutOrg,
      allUsers: allUsers,
      counts: {
        total: allUsers.length,
        withoutOrg: usersWithoutOrg.length,
        withOrg: allUsers.length - usersWithoutOrg.length
      }
    });

  } catch (error) {
    console.error('Error checking users:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
