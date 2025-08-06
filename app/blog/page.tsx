'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { 
  Clock, 
  Eye, 
  User, 
  Calendar,
  Search,
  Tag,
  BookOpen,
  TrendingUp
} from 'lucide-react';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  author: {
    name: string;
  };
  views: number;
  readingTime: number;
  publishedAt: string;
}

interface Category {
  name: string;
  count: number;
}

interface Tag {
  name: string;
  count: number;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchBlogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9'
      });
      
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/blog?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBlogs(data.blogs);
        setCategories(data.categories);
        setPopularTags(data.popularTags);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchBlogs();
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        page: '1',
        limit: '9'
      });

      const response = await fetch(`/api/blog?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBlogs(data.blogs);
        setPagination(data.pagination);
        setPage(1);
      }
    } catch (error) {
      console.error('Error searching blogs:', error);
    } finally {
      setLoading(false);
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

  const formatCategoryName = (category: string) => {
    return category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted/60">
      <Navigation />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-muted/60 py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-8">
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                <BookOpen className="mr-2 h-4 w-4" />
                Healthcare Compliance Insights
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Healthcare Compliance Blog
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stay informed with the latest insights on healthcare compliance, HIPAA regulations, 
              and best practices for medical practices.
            </p>
            {/* Search Bar */}
            <div className="max-w-lg mx-auto flex gap-2">
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-background border-muted text-foreground"
              />
              <Button onClick={handleSearch} variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background gradients */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-400 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading articles...</p>
              </div>
            ) : blogs.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No articles found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Check back soon for new content.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Results Info */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {searchTerm ? `Search Results for "${searchTerm}"` : 
                     selectedCategory ? `${formatCategoryName(selectedCategory)} Articles` : 
                     'Latest Articles'}
                  </h2>
                  {pagination && (
                    <p className="text-muted-foreground">
                      {pagination.total} article{pagination.total !== 1 ? 's' : ''} found
                    </p>
                  )}
                </div>

                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {blogs.map((blog) => (
                    <Card key={blog._id} className="group hover:shadow-lg transition-shadow bg-card">
                      <Link href={`/blog/${blog.slug}`}>
                        {blog.featuredImage && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            <Image 
                              src={blog.featuredImage} 
                              alt={blog.title}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getCategoryColor(blog.category)}>
                              {formatCategoryName(blog.category)}
                            </Badge>
                          </div>
                          <CardTitle className="group-hover:text-blue-600 transition-colors line-clamp-2">
                            {blog.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-3">
                            {blog.excerpt}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {blog.author.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {blog.readingTime} min
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {blog.views}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
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
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setPage(1);
                    }}
                    className={`w-full text-left p-2 rounded hover:bg-muted ${
                      !selectedCategory ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setPage(1);
                      }}
                      className={`w-full text-left p-2 rounded hover:bg-muted flex justify-between ${
                        selectedCategory === category.name ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      <span>{formatCategoryName(category.name)}</span>
                      <span className="text-muted-foreground">({category.count})</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Popular Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge 
                      key={tag.name} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => {
                        setSearchTerm(tag.name);
                        handleSearch();
                      }}
                    >
                      {tag.name} ({tag.count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Signup */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Stay Updated</CardTitle>
                <CardDescription>
                  Get the latest compliance insights delivered to your inbox.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input placeholder="Enter your email" />
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
