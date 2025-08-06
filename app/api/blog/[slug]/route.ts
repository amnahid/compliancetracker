import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';

// GET /api/blog/[slug] - Get single blog by slug (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    const { slug } = await params;

    const blog = await Blog.findOne({ 
      slug: slug, 
      status: 'published' 
    })
      .populate('author', 'name email')
      .lean() as any;

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Increment views (fire and forget)
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).catch(console.error);

    // Get related blogs (same category, exclude current)
    const relatedBlogs = await Blog.find({
      status: 'published',
      category: blog.category,
      _id: { $ne: blog._id }
    })
      .populate('author', 'name')
      .select('title slug excerpt featuredImage publishedAt readingTime')
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    return NextResponse.json({
      blog,
      relatedBlogs
    });

  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}
