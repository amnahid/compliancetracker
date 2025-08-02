import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Subscription from '@/lib/models/Subscription';
import { requireAdminWithOrganization } from '@/lib/organization-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();

    // Filter by organization for multi-tenant stats
    const orgFilter = { organization: authResult.organization?.id };

    const [
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      newUsersThisMonth,
    ] = await Promise.all([
      User.countDocuments(orgFilter),
      Subscription.countDocuments({ ...orgFilter, status: 'active' }),
      Subscription.aggregate([
        { $match: { ...orgFilter, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
      User.countDocuments({
        ...orgFilter,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      totalRevenue: totalRevenue[0]?.total || 0,
      newUsersThisMonth,
      organization: authResult.organization?.id,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

