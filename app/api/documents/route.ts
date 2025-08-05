import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/organization-utils';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';
import { sendDocumentAssignmentEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    await connectDB();
    ensureModelsRegistered();

    const User = getModel('User');
    const DocumentModel = getModel('Document');

    // Find the current user to get their proper MongoDB _id
    const currentUser = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization?.id 
    });
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let documentsQuery;

    if (authResult.user?.role === 'admin') {
      // Admins can see all documents in their organization
      documentsQuery = DocumentModel.find({ 
        organization: authResult.organization?.id 
      });
    } else {
      // For regular users, first get admin user IDs to filter public documents
      const adminUserIds = await User.find({ 
        organization: authResult.organization?.id, 
        role: 'admin' 
      }).distinct('_id');

      // Regular users can only see:
      // 1. Documents they uploaded themselves
      // 2. Documents where they are specifically assigned access (regardless of who uploaded)
      // 3. Public documents uploaded by admins only
      documentsQuery = DocumentModel.find({
        organization: authResult.organization?.id,
        $or: [
          // Documents uploaded by the current user
          { uploadedBy: currentUser._id },
          // Restricted documents where user is specifically assigned access
          { visibility: 'restricted', assignedTo: currentUser._id },
          // Public documents uploaded by admins only
          { visibility: 'public', uploadedBy: { $in: adminUserIds } }
        ]
      });
    }

    const documents = await documentsQuery
      .populate('uploadedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ uploadDate: -1 });

    // Transform the data to include uploader name and calculate status
    const transformedDocuments = documents.map(doc => {
      let status = 'active';
      
      if (doc.expirationDate) {
        const now = new Date();
        const daysUntilExpiration = Math.ceil((new Date(doc.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration < 0) {
          status = 'expired';
        } else if (daysUntilExpiration <= 30) {
          status = 'expiring-soon';
        }
      }

      return {
        _id: doc._id,
        name: doc.name,
        type: doc.type,
        category: doc.category,
        uploadedBy: doc.uploadedBy._id,
        uploadedByName: doc.uploadedBy.name,
        uploadDate: doc.uploadDate,
        expirationDate: doc.expirationDate,
        size: doc.size,
        url: doc.url,
        visibility: doc.visibility,
        assignedTo: doc.assignedTo?.map((user: any) => ({
          _id: user._id,
          name: user.name,
          email: user.email
        })) || [],
        departments: doc.departments || [],
        status
      };
    });

    return NextResponse.json(transformedDocuments);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const expirationDate = formData.get('expirationDate') as string;
    const visibility = formData.get('visibility') as string || 'public';
    const assignedTo = formData.get('assignedTo') as string; // JSON string of user IDs
    const departments = formData.get('departments') as string; // JSON string of departments

    if (!file || !name || !category) {
      return NextResponse.json(
        { message: 'File, name, and category are required' },
        { status: 400 }
      );
    }

    // Validate visibility value
    if (!['public', 'restricted'].includes(visibility)) {
      return NextResponse.json(
        { message: 'Visibility must be either public or restricted' },
        { status: 400 }
      );
    }

    // For now, we'll store file info in database
    // In production, you'd upload to cloud storage (AWS S3, Azure Blob, etc.)
    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');

    await connectDB();
    ensureModelsRegistered();

    const User = getModel('User');
    const DocumentModel = getModel('Document');

    // Find the current user by email to get their proper MongoDB _id
    const currentUser = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization?.id 
    });
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Parse assigned users and departments
    let parsedAssignedTo = [];
    let parsedDepartments = [];

    try {
      if (assignedTo) {
        parsedAssignedTo = JSON.parse(assignedTo);
      }
      if (departments) {
        parsedDepartments = JSON.parse(departments);
      }
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid assignedTo or departments format' },
        { status: 400 }
      );
    }

    // Only admins can create restricted documents with specific assignments
    if (visibility === 'restricted' && authResult.user?.role !== 'admin' && parsedAssignedTo.length > 0) {
      return NextResponse.json(
        { message: 'Only administrators can create restricted documents with specific user assignments' },
        { status: 403 }
      );
    }

    const document = new DocumentModel({
      name,
      type: file.type,
      category,
      uploadedBy: currentUser._id,
      organization: authResult.organization?.id,
      uploadDate: new Date(),
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      size: file.size,
      visibility,
      assignedTo: visibility === 'restricted' ? parsedAssignedTo : [],
      departments: parsedDepartments,
      // Store as base64 for demo purposes - use cloud storage in production
      fileData: base64File,
      url: `/api/documents/${Date.now()}-${file.name}`
    });

    await document.save();

    // Populate the uploader and assigned users for response
    await document.populate('uploadedBy', 'name email');
    await document.populate('assignedTo', 'name email');

    // Send email notifications to assigned users
    if (visibility === 'restricted' && document.assignedTo && document.assignedTo.length > 0) {
      try {
        const organizationName = typeof authResult.organization === 'object' 
          ? authResult.organization.name 
          : 'Your Organization';
        
        const emailPromises = document.assignedTo.map((user: any) => 
          sendDocumentAssignmentEmail(
            user.email,
            user.name,
            document.name,
            document.category,
            currentUser.name,
            organizationName
          )
        );
        
        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.error('Failed to send document assignment emails:', emailError);
        // Continue with response even if emails fail
      }
    }

    let status = 'active';
    if (document.expirationDate) {
      const now = new Date();
      const daysUntilExpiration = Math.ceil((new Date(document.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration < 0) {
        status = 'expired';
      } else if (daysUntilExpiration <= 30) {
        status = 'expiring-soon';
      }
    }

    const responseDocument = {
      _id: document._id,
      name: document.name,
      type: document.type,
      category: document.category,
      uploadedBy: document.uploadedBy._id,
      uploadedByName: document.uploadedBy.name,
      uploadDate: document.uploadDate,
      expirationDate: document.expirationDate,
      size: document.size,
      url: document.url,
      visibility: document.visibility,
      assignedTo: document.assignedTo?.map((user: any) => ({
        _id: user._id,
        name: user.name,
        email: user.email
      })) || [],
      departments: document.departments || [],
      status
    };

    return NextResponse.json(responseDocument, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


