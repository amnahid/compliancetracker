import { NextRequest, NextResponse } from 'next/server';
import { requireAdminWithOrganization } from '@/lib/organization-utils';

// Helper function to format timestamps
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    // For now, return empty array since no real activity logs exist yet
    // In the future, this will query actual database activity logs filtered by organization
    const activities: any[] = [];

    return NextResponse.json({
      activities,
      success: true,
      count: activities.length,
      organization: authResult.organization,
      message: activities.length === 0 ? 'No recent activity found' : undefined
    });

  } catch (error) {
    console.error('Error fetching activity data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to log new activity
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const { type, description } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    // In the future, implement actual activity logging to database with organization filtering
    console.log('Activity logged:', { 
      type, 
      description, 
      user: authResult.user?.email,
      organization: authResult.organization
    });

    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully'
    });

  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


