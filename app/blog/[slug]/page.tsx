import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';
import { generateBlogSEO } from '@/lib/seo-utils';
import BlogPostClient from './blog-post-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    
    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    const blog = await Blog.findOne({ 
      slug, 
      status: 'published' 
    })
    .populate('author', 'name email')
    .lean();

    if (!blog) {
      return {
        title: 'Blog Post Not Found | ComplianceTracker',
        description: 'The requested blog post could not be found.',
      };
    }

    const blogData = blog as any; // Type assertion for lean document

    return generateBlogSEO({
      title: blogData.title,
      excerpt: blogData.excerpt,
      slug: blogData.slug,
      category: blogData.category,
      tags: blogData.tags || [],
      author: { name: blogData.author.name },
      publishedAt: blogData.publishedAt?.toISOString() || blogData.createdAt.toISOString(),
      updatedAt: blogData.updatedAt?.toISOString(),
      featuredImage: blogData.featuredImage,
      readingTime: blogData.readingTime,
    });
  } catch (error) {
    console.error('Error generating blog metadata:', error);
    return {
      title: 'Blog Post | ComplianceTracker',
      description: 'Healthcare compliance insights and best practices.',
    };
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  
  // Pre-fetch blog data for SEO and initial render
  try {
    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    const blog = await Blog.findOne({ 
      slug, 
      status: 'published' 
    })
    .populate('author', 'name email')
    .lean();

    if (!blog) {
      notFound();
    }

    const blogData = blog as any; // Type assertion for lean document

    // Convert to plain object for client component
    const blogForClient = {
      ...blogData,
      _id: blogData._id.toString(),
      author: {
        ...blogData.author,
        _id: blogData.author._id.toString(),
      },
      publishedAt: blogData.publishedAt?.toISOString() || blogData.createdAt.toISOString(),
      createdAt: blogData.createdAt.toISOString(),
      updatedAt: blogData.updatedAt.toISOString(),
    };

    return <BlogPostClient initialBlog={blogForClient} />;
  } catch (error) {
    console.error('Error fetching blog:', error);
    notFound();
  }
}