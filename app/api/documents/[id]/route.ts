import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Document from '@/lib/models/Document';
import User from '@/lib/models/User';
import { requireAuthWithOrganization } from '@/lib/organization-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const expirationDate = formData.get('expirationDate') as string;
    const visibility = formData.get('visibility') as string;
    const assignedTo = formData.get('assignedTo') as string;
    const departments = formData.get('departments') as string;

    if (!name || !category) {
      return NextResponse.json(
        { message: 'Name and category are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the current user by email to get their proper MongoDB _id
    const currentUser = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization?.id 
    });
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // First find the document to check permissions
    const existingDocument = await Document.findOne({
      _id: id,
      organization: authResult.organization?.id
    });

    if (!existingDocument) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to modify this document
    const isAdmin = authResult.user?.role === 'admin';
    const isOwner = existingDocument.uploadedBy.toString() === currentUser._id.toString();
    
    // For modification, only allow:
    // 1. Admins can modify any document
    // 2. Document owners can modify their own documents
    const canModify = isAdmin || isOwner;

    if (!canModify) {
      return NextResponse.json(
        { message: 'You do not have permission to modify this document. Only admins and document owners can make changes.' },
        { status: 403 }
      );
    }

    // Only admins and document owners can modify visibility and assignments
    const updateData: any = {
      name,
      category,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined
    };

    if (isAdmin || isOwner) {
      if (visibility) {
        updateData.visibility = visibility;
      }
      
      try {
        if (assignedTo) {
          updateData.assignedTo = JSON.parse(assignedTo);
        }
        if (departments) {
          updateData.departments = JSON.parse(departments);
        }
      } catch (error) {
        return NextResponse.json(
          { message: 'Invalid assignedTo or departments format' },
          { status: 400 }
        );
      }
    }

    const document = await Document.findOneAndUpdate(
      { 
        _id: id,
        organization: authResult.organization?.id
      },
      updateData,
      { new: true }
    ).populate('uploadedBy', 'name email')
     .populate('assignedTo', 'name email');

    if (!document) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    // Calculate status
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

    return NextResponse.json(responseDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;

    await connectDB();

    // Find the current user by email to get their proper MongoDB _id
    const currentUser = await User.findOne({ 
      email: authResult.user?.email,
      organization: authResult.organization?.id 
    });
    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // First find the document to check permissions
    const existingDocument = await Document.findOne({
      _id: id,
      organization: authResult.organization?.id
    });

    if (!existingDocument) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this document
    const isAdmin = authResult.user?.role === 'admin';
    const isOwner = existingDocument.uploadedBy.toString() === currentUser._id.toString();

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: 'You can only delete documents you uploaded. Only administrators can delete any document.' },
        { status: 403 }
      );
    }

    // Find and delete the document
    const document = await Document.findOneAndDelete({
      _id: id,
      organization: authResult.organization?.id
    });

    if (!document) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
