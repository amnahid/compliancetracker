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

    // Get registration platform statistics for the organization
    const providerStats = await User.aggregate([
      {
        $match: { organization: authResult.organization }
      },
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          users: {
            $push: {
              email: '$email',
              name: '$name',
              createdAt: '$createdAt',
              role: '$role'
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get total user count for the organization
    const totalUsers = await User.countDocuments({ 
      organization: authResult.organization 
    });

    // Format the response
    const registrationAnalytics = {
      totalUsers,
      organization: authResult.organization,
      providerBreakdown: providerStats.map(stat => ({
        provider: stat._id || 'credentials',
        count: stat.count,
        percentage: Math.round((stat.count / totalUsers) * 100),
        users: stat.users
      })),
      summary: {
        emailPassword: providerStats.find(s => s._id === 'credentials')?.count || 0,
        google: providerStats.find(s => s._id === 'google')?.count || 0,
        github: providerStats.find(s => s._id === 'github')?.count || 0
      }
    };

    return NextResponse.json(registrationAnalytics);

  } catch (error) {
    console.error('Error fetching registration analytics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


