import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import Document from '@/lib/models/Document';
import User from '@/lib/models/User';
import { requireAuthWithOrganization } from '@/lib/organization-utils';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();

    // Only create sample data if user doesn't have any tasks or documents
    const existingTasks = await Task.countDocuments({ 
      organization: authResult.organization 
    });
    
    const existingDocuments = await Document.countDocuments({ 
      organization: authResult.organization 
    });

    if (existingTasks > 0 || existingDocuments > 0) {
      return NextResponse.json({ 
        message: 'Sample data already exists',
        existing: { tasks: existingTasks, documents: existingDocuments }
      });
    }

    // Create sample tasks
    const sampleTasks = [
      {
        title: 'Complete HIPAA Training Module',
        description: 'Complete the annual HIPAA compliance training module',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assignee: authResult.user?.id,
        organization: authResult.organization,
        createdBy: authResult.user?.id,
        status: 'pending',
        priority: 'high',
        category: 'hipaa-training'
      },
      {
        title: 'Renew Medical License',
        description: 'Renew state medical license before expiration',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        assignee: authResult.user?.id,
        organization: authResult.organization,
        createdBy: authResult.user?.id,
        status: 'pending',
        priority: 'high',
        category: 'license-renewal'
      },
      {
        title: 'Update Patient Privacy Procedures',
        description: 'Review and update patient privacy procedures documentation',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        assignee: authResult.user?.id,
        organization: authResult.organization,
        createdBy: authResult.user?.id,
        status: 'in-progress',
        priority: 'medium',
        category: 'documentation'
      },
      {
        title: 'Fire Safety Training',
        description: 'Complete annual fire safety training certification',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        assignee: authResult.user?.id,
        organization: authResult.organization,
        createdBy: authResult.user?.id,
        status: 'pending',
        priority: 'medium',
        category: 'safety-training'
      },
      {
        title: 'Equipment Maintenance Review',
        description: 'Review and sign off on monthly equipment maintenance reports',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
        assignee: authResult.user?.id,
        organization: authResult.organization,
        createdBy: authResult.user?.id,
        status: 'pending',
        priority: 'low',
        category: 'other'
      },
      {
        title: 'Quality Assurance Audit',
        description: 'Completed quarterly quality assurance audit review',
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        assignee: authResult.user?.id,
        organization: authResult.organization,
        createdBy: authResult.user?.id,
        status: 'completed',
        priority: 'high',
        category: 'documentation'
      }
    ];

    // Create sample documents
    const sampleDocuments = [
      {
        name: 'Medical License Certificate',
        type: 'pdf',
        category: 'license',
        uploadedBy: authResult.user?.id,
        organization: authResult.organization,
        uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        size: 2456789,
        url: '/uploads/medical-license.pdf'
      },
      {
        name: 'HIPAA Training Certificate',
        type: 'pdf',
        category: 'training',
        uploadedBy: authResult.user?.id,
        organization: authResult.organization,
        uploadDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now (expiring soon)
        size: 1234567,
        url: '/uploads/hipaa-training.pdf'
      },
      {
        name: 'Insurance Policy Document',
        type: 'pdf',
        category: 'insurance',
        uploadedBy: authResult.user?.id,
        organization: authResult.organization,
        uploadDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
        expirationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
        size: 3456789,
        url: '/uploads/insurance-policy.pdf'
      },
      {
        name: 'Safety Protocol Manual',
        type: 'pdf',
        category: 'policy',
        uploadedBy: authResult.user?.id,
        organization: authResult.organization,
        uploadDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        expirationDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000), // 275 days from now
        size: 5678901,
        url: '/uploads/safety-protocol.pdf'
      },
      {
        name: 'Employee Handbook',
        type: 'pdf',
        category: 'policy',
        uploadedBy: authResult.user?.id,
        organization: authResult.organization,
        uploadDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        size: 4567890,
        url: '/uploads/employee-handbook.pdf'
      }
    ];

    // Insert the sample data
    await Task.insertMany(sampleTasks);
    await Document.insertMany(sampleDocuments);

    return NextResponse.json({
      message: 'Sample data created successfully',
      created: {
        tasks: sampleTasks.length,
        documents: sampleDocuments.length
      }
    });
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


