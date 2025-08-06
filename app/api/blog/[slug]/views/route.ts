import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    // Increment view count
    const blog = await Blog.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ views: blog.views });

  } catch (error) {
    console.error('Error updating blog views:', error);
    return NextResponse.json({ error: 'Failed to update views' }, { status: 500 });
  }
}
