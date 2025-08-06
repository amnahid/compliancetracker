'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { 
  Clock, 
  Eye, 
  User, 
  Calendar,
  Share2,
  ArrowLeft,
  BookOpen,
  Tag
} from 'lucide-react';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  views: number;
  readingTime: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialBlog: Blog;
}

export default function BlogPostClient({ initialBlog }: Props) {
  const [blog, setBlog] = useState<Blog>(initialBlog);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch related blogs on component mount
  const fetchRelatedBlogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/blog?category=${blog.category}&limit=3&exclude=${blog._id}`);
      const data = await response.json();
      
      if (response.ok) {
        setRelatedBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  }, [blog.category, blog._id]);

  useEffect(() => {
    fetchRelatedBlogs();
    
    // Update page views
    const updateViews = async () => {
      try {
        await fetch(`/api/blog/${blog.slug}/views`, { method: 'POST' });
      } catch (error) {
        console.error('Error updating views:', error);
      }
    };
    
    updateViews();
  }, [fetchRelatedBlogs, blog.slug]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'compliance': 'bg-blue-100 text-blue-800',
      'healthcare': 'bg-green-100 text-green-800',
      'hipaa': 'bg-red-100 text-red-800',
      'best-practices': 'bg-purple-100 text-purple-800',
      'updates': 'bg-orange-100 text-orange-800',
      'case-studies': 'bg-indigo-100 text-indigo-800',
      'tutorials': 'bg-teal-100 text-teal-800',
      'news': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatCategoryName = (category: string) => {
    return category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const sharePost = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted/60">
      <Navigation />
      {/* Navigation */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <article className="bg-card/80 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden border border-border/50">
            {blog.featuredImage && (
              <div className="aspect-video overflow-hidden">
                <Image 
                  src={blog.featuredImage} 
                  alt={blog.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-8">
              {/* Meta Info */}
              <div className="flex items-center gap-2 mb-4">
                <Badge className={getCategoryColor(blog.category)}>
                  {formatCategoryName(blog.category)}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {blog.readingTime} min read
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {blog.views} views
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {blog.title}
              </h1>

              {/* Author and Share */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{blog.author.name}</p>
                    <p className="text-sm text-muted-foreground">Healthcare Compliance Expert</p>
                  </div>
                </div>
                <Button variant="outline" onClick={sharePost} className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Related Articles */}
          {relatedBlogs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <Card key={relatedBlog._id} className="group hover:shadow-lg transition-shadow">
                    <Link href={`/blog/${relatedBlog.slug}`}>
                      {relatedBlog.featuredImage && (
                        <div className="aspect-video overflow-hidden rounded-t-lg">
                          <Image 
                            src={relatedBlog.featuredImage} 
                            alt={relatedBlog.title}
                            width={300}
                            height={169}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                          {relatedBlog.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {relatedBlog.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {relatedBlog.author.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {relatedBlog.readingTime} min
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* CTA Section */}
          <Card className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Streamline Your Compliance?
              </h3>
              <p className="text-blue-100 mb-6">
                Join thousands of healthcare practices using ComplianceTracker to stay compliant and organized.
              </p>
              <Link href="/auth/signup">
                <Button variant="secondary" size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
