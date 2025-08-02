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

    const notificationSettings = await request.json();

    await connectToDatabase();

    const user = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization?.id 
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update notification preferences
    user.notificationSettings = {
      emailNotifications: notificationSettings.emailNotifications ?? true,
      taskReminders: notificationSettings.taskReminders ?? true,
      documentExpiration: notificationSettings.documentExpiration ?? true,
      systemUpdates: notificationSettings.systemUpdates ?? false,
      weeklyReports: notificationSettings.weeklyReports ?? true,
    };

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ 
      message: 'Notification settings updated successfully',
      notificationSettings: user.notificationSettings 
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
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
      notificationSettings: user.notificationSettings || {
        emailNotifications: true,
        taskReminders: true,
        documentExpiration: true,
        systemUpdates: false,
        weeklyReports: true,
      }
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

