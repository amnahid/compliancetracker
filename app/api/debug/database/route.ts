import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import Document from '@/lib/models/Document';
import User from '@/lib/models/User';
import { requireAuthWithOrganization } from '@/lib/organization-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();

    // Get counts of all data
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    const documentCount = await Document.countDocuments();

    // Get user's organization tasks and documents
    const userTasks = await Task.find({ 
      organization: authResult.organization 
    }).limit(5);
    
    const userDocuments = await Document.find({ 
      organization: authResult.organization 
    }).limit(5);

    // Get all tasks and documents for debugging
    const allTasks = await Task.find({}).limit(10);
    const allDocuments = await Document.find({}).limit(10);

    return NextResponse.json({
      session: {
        userId: authResult.user?.id,
        userEmail: authResult.user?.email,
        userOrganization: authResult.organization,
        userRole: authResult.user?.role
      },
      counts: {
        users: userCount,
        tasks: taskCount,
        documents: documentCount
      },
      userSpecific: {
        tasks: userTasks.length,
        documents: userDocuments.length,
        sampleTasks: userTasks.map(t => ({ 
          id: t._id, 
          title: t.title, 
          organization: t.organization,
          status: t.status 
        })),
        sampleDocuments: userDocuments.map(d => ({ 
          id: d._id, 
          name: d.name, 
          organization: d.organization 
        }))
      },
      debugging: {
        allTaskOrganizations: allTasks.map(t => t.organization),
        allDocumentOrganizations: allDocuments.map(d => d.organization)
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


