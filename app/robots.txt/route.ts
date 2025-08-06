import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://compliancetracker.com';
  
  const robotsTxt = `User-agent: *
Allow: /

# Allow crawling of all public pages
Allow: /blog
Allow: /blog/*

# Disallow admin and auth pages
Disallow: /admin
Disallow: /admin/*
Disallow: /api
Disallow: /api/*
Disallow: /auth
Disallow: /auth/*
Disallow: /dashboard
Disallow: /dashboard/*

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  });
}
