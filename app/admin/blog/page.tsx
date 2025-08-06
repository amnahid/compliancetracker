'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  User,
  Search,
  Filter,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  author: {
    name: string;
    email: string;
  };
  views: number;
  readingTime: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogManagementPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  // Check if in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  const fetchBlogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/admin/blog?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBlogs(data.blogs);
        setPagination(data.pagination);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch blogs',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, toast]);

  useEffect(() => {
    if (!isDevelopment) {
      toast({
        title: 'Access Restricted',
        description: 'Blog management is only available in development mode.',
        variant: 'destructive',
      });
      router.push('/dashboard');
      return;
    }
    fetchBlogs();
  }, [page, statusFilter, categoryFilter, isDevelopment, router, toast, fetchBlogs]);

  const deleteBlog = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Blog deleted successfully',
        });
        fetchBlogs();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete blog',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  // Filter blogs based on search term
  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isDevelopment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Blog management is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Management</h1>
          <p className="text-gray-600">Manage your compliance blog content (Development Mode)</p>
        </div>
        <Button onClick={() => router.push('/admin/blog/editor')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Blog
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="hipaa">HIPAA</SelectItem>
            <SelectItem value="best-practices">Best Practices</SelectItem>
            <SelectItem value="updates">Updates</SelectItem>
            <SelectItem value="case-studies">Case Studies</SelectItem>
            <SelectItem value="tutorials">Tutorials</SelectItem>
            <SelectItem value="news">News</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => {
          setSearchTerm('');
          setStatusFilter('');
          setCategoryFilter('');
          setPage(1);
        }}>
          Clear Filters
        </Button>
      </div>

      {/* Stats */}
      {pagination && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Blogs</p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">
                    {blogs.filter(b => b.status === 'published').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {blogs.filter(b => b.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {blogs.reduce((sum, blog) => sum + blog.views, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Blog List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No blogs found</h3>
              <p className="text-gray-600">Create your first blog post to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filteredBlogs.map((blog) => (
            <Card key={blog._id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(blog.status)}>
                        {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                      </Badge>
                      <Badge className={getCategoryColor(blog.category)}>
                        {blog.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{blog.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{blog.excerpt}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {blog.author.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {blog.readingTime} min read
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {blog.views} views
                      </div>
                      <div>
                        {blog.publishedAt ? 
                          new Date(blog.publishedAt).toLocaleDateString() :
                          `Draft - ${new Date(blog.updatedAt).toLocaleDateString()}`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {blog.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/blog/editor?id=${blog._id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBlog(blog._id, blog.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
