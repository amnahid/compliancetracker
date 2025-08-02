import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Organization from '@/lib/models/Organization';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with admin access
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find all users with string-based organizations (legacy users)
    const legacyUsers = await User.find({
      organization: { $type: "string" }
    });

    console.log(`Found ${legacyUsers.length} legacy users to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const user of legacyUsers) {
      try {
        // Reset organization to null so they go through setup flow
        await User.findByIdAndUpdate(user._id, {
          organization: null
        });

        console.log(`Reset organization for user: ${user.email}`);
        migrated++;
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      stats: {
        totalFound: legacyUsers.length,
        migrated,
        errors
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
