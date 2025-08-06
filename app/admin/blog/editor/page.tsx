'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  X, 
  Eye,
  Upload,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string;
  status: 'draft' | 'published';
  metaTitle: string;
  metaDescription: string;
  publishedAt: string;
}

const initialFormData: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tags: [],
  featuredImage: '',
  status: 'draft',
  metaTitle: '',
  metaDescription: '',
  publishedAt: new Date().toISOString().split('T')[0]
};

const categories = [
  'compliance',
  'healthcare',
  'hipaa',
  'best-practices',
  'updates',
  'case-studies',
  'tutorials',
  'news'
];

// Blog editor content component that uses search params
function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogId = searchParams.get('id');
  const isEdit = !!blogId;

  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  const checkEnvironment = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/blog');
      if (response.status === 403) {
        router.push('/admin/blog');
        return;
      }
      setIsDevelopment(true);
    } catch (error) {
      console.error('Environment check failed:', error);
      router.push('/admin/blog');
    }
  }, [router]);

  const fetchBlog = useCallback(async () => {
    if (!blogId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/blog/${blogId}`);
      const data = await response.json();

      if (response.ok) {
        const blog = data; // API returns blog directly, not wrapped in { blog: ... }
        if (blog && typeof blog === 'object') {
          setFormData({
            title: blog.title || '',
            slug: blog.slug || '',
            excerpt: blog.excerpt || '',
            content: blog.content || '',
            category: blog.category || '',
            tags: blog.tags || [],
            featuredImage: blog.featuredImage || '',
            status: blog.status || 'draft',
            metaTitle: blog.metaTitle || '',
            metaDescription: blog.metaDescription || '',
            publishedAt: blog.publishedAt ? 
              new Date(blog.publishedAt).toISOString().split('T')[0] : 
              new Date().toISOString().split('T')[0]
          });
        } else {
          setError('Invalid blog data received');
        }
      } else {
        setError(data.error || 'Failed to fetch blog');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      setError('Failed to fetch blog');
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    checkEnvironment();
    if (isEdit) {
      fetchBlog();
    }
  }, [isEdit, blogId, checkEnvironment, fetchBlog]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
  };

  const handleInputChange = (field: keyof BlogFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'title' && !isEdit ? { slug: generateSlug(value) } : {})
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        status,
        publishedAt: status === 'published' ? 
          (formData.publishedAt ? new Date(formData.publishedAt).toISOString() : new Date().toISOString()) : 
          null
      };

      const url = isEdit ? `/api/admin/blog/${blogId}` : '/api/admin/blog';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/blog');
      } else {
        setError(data.error || 'Failed to save blog');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      setError('Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isDevelopment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              Blog management is only available in development mode.
            </p>
            <Link href="/admin/blog">
              <Button variant="outline">Go Back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/admin/blog">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog Management
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                disabled={saving}
              >
                <Eye className="h-4 w-4 mr-2" />
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter blog title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      placeholder="Brief description of the blog post"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="featuredImage"
                        value={formData.featuredImage}
                        onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Content *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write your blog content here..."
                    rows={20}
                    className="font-mono"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    You can use HTML for formatting. Rich text editor coming soon.
                  </p>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                      placeholder="SEO title (leave empty to use blog title)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      placeholder="SEO description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publishing */}
              <Card>
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'draft' | 'published') => 
                        setFormData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="publishedAt">Publish Date</Label>
                    <Input
                      id="publishedAt"
                      type="date"
                      value={formData.publishedAt}
                      onChange={(e) => handleInputChange('publishedAt', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {formatCategoryName(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button variant="outline" size="sm" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function BlogEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog editor...</p>
        </div>
      </div>
    }>
      <BlogEditorContent />
    </Suspense>
  );
}
