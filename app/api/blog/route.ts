import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';

// GET /api/blog - Get published blogs (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20); // Max 20 per page
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    
    let blogs;
    let total;

    if (search) {
      // Search blogs
      blogs = await Blog.find({
        status: 'published',
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      })
        .populate('author', 'name')
        .select('title slug excerpt category tags featuredImage publishedAt readingTime views author')
        .sort({ publishedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      total = await Blog.countDocuments({
        status: 'published',
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    } else if (category) {
      // Filter by category
      blogs = await Blog.find({ status: 'published', category })
        .populate('author', 'name')
        .select('title slug excerpt category tags featuredImage publishedAt readingTime views author')
        .sort({ publishedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      total = await Blog.countDocuments({ status: 'published', category });
    } else {
      // Get all published blogs
      blogs = await Blog.find({ status: 'published' })
        .populate('author', 'name')
        .select('title slug excerpt category tags featuredImage publishedAt readingTime views author')
        .sort({ publishedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      total = await Blog.countDocuments({ status: 'published' });
    }

    // Get categories for sidebar
    const categories = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get popular tags
    const popularTags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      categories: categories.map(cat => ({ name: cat._id, count: cat.count })),
      popularTags: popularTags.map(tag => ({ name: tag._id, count: tag.count }))
    });

  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}
