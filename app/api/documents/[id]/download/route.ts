import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Document from '@/lib/models/Document';
import User from '@/lib/models/User';
import { requireAuthWithOrganization } from '@/lib/organization-utils';

export async function GET(
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

    // Find the document and include fileData and uploader info
    const document = await Document.findOne({
      _id: id,
      organization: authResult.organization?.id
    }).select('+fileData').populate('uploadedBy', 'role');

    if (!document) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to access this document
    const isAdmin = authResult.user?.role === 'admin';
    const isOwner = document.uploadedBy._id.toString() === currentUser._id.toString();
    const uploaderIsAdmin = (document.uploadedBy as any).role === 'admin';
    
    let hasAccess = false;
    
    if (isAdmin) {
      // Admins can access all documents
      hasAccess = true;
    } else if (isOwner) {
      // Users can access documents they uploaded
      hasAccess = true;
    } else if (document.visibility === 'restricted' && document.assignedTo?.includes(currentUser._id)) {
      // Users can access restricted documents they're assigned to
      hasAccess = true;
    } else if (document.visibility === 'public' && uploaderIsAdmin) {
      // Users can access public documents uploaded by admins only
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have permission to access this document' },
        { status: 403 }
      );
    }

    if (!document.fileData) {
      return NextResponse.json(
        { message: 'File data not available' },
        { status: 404 }
      );
    }

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(document.fileData, 'base64');

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', document.type || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${document.name}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
