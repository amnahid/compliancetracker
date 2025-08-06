import { NextResponse } from 'next/server';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';

// Generate sitemap.xml dynamically
export async function GET() {
  try {
    await connectDB();
    await ensureModelsRegistered();
    const Blog = getModel('Blog');

    // Get all published blogs
    const blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://compliancetracker.com';
    
    // Static pages
    const staticPages = [
      {
        url: '',
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        url: '/blog',
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        url: '/auth/signin',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.7'
      },
      {
        url: '/auth/signup',
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.8'
      }
    ];

    // Dynamic blog pages
    const blogPages = blogs.map((blog) => ({
      url: `/blog/${blog.slug}`,
      lastmod: new Date(blog.updatedAt).toISOString(),
      changefreq: 'weekly',
      priority: '0.8'
    }));

    const allPages = [...staticPages, ...blogPages];

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return minimal sitemap on error
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://compliancetracker.com';
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Short cache on error
      },
    });
  }
}
