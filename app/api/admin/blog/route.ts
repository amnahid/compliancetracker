import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';
import mongoose from 'mongoose';

// Helper function to check if we're in development mode
function isDevelopmentMode() {
  return process.env.NODE_ENV === 'development';
}

// GET /api/admin/blog - List all blogs (development only)
export async function GET(request: NextRequest) {
  if (!isDevelopmentMode()) {
    return NextResponse.json({ error: 'Blog management is only available in development mode' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;

    // Get blogs with pagination
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Blog.countDocuments(query)
    ]);

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

// POST /api/admin/blog - Create new blog (development only)
export async function POST(request: NextRequest) {
  if (!isDevelopmentMode()) {
    return NextResponse.json({ error: 'Blog management is only available in development mode' }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');
    const User = getModel('User');

    const blogData = await request.json();
    
    // Validate required fields
    const { title, excerpt, content, category } = blogData;
    if (!title || !excerpt || !content || !category) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, excerpt, content, category' 
      }, { status: 400 });
    }

    // Find the user by email to get the MongoDB ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Create blog
    const blog = new Blog({
      ...blogData,
      author: user._id
    });

    await blog.save();
    await blog.populate('author', 'name email');

    return NextResponse.json(blog, { status: 201 });

  } catch (error) {
    console.error('Error creating blog:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'Blog slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}
