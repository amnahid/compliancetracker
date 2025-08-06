import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';

// Helper function to check if we're in development mode
function isDevelopmentMode() {
  return process.env.NODE_ENV === 'development';
}

// GET /api/admin/blog/[id] - Get single blog (development only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDevelopmentMode()) {
    return NextResponse.json({ error: 'Blog management is only available in development mode' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    const blog = await Blog.findById(id)
      .populate('author', 'name email')
      .lean();

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);

  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}

// PUT /api/admin/blog/[id] - Update blog (development only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDevelopmentMode()) {
    return NextResponse.json({ error: 'Blog management is only available in development mode' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    const updateData = await request.json();

    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);

  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

// DELETE /api/admin/blog/[id] - Delete blog (development only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDevelopmentMode()) {
    return NextResponse.json({ error: 'Blog management is only available in development mode' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Blog deleted successfully' });

  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}
