import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: object;
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonicalUrl,
    ogImage,
    noIndex = false,
    structuredData,
  } = config;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://compliancetracker.com';
  const defaultOgImage = `${baseUrl}/api/og`;

  return {
    title,
    description,
    keywords: keywords.join(', '),
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title,
      description,
      url: canonicalUrl || baseUrl,
      siteName: 'ComplianceTracker',
      images: [
        {
          url: ogImage || defaultOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage || defaultOgImage],
      creator: '@ComplianceTracker',
    },
    other: structuredData ? {
      'application/ld+json': JSON.stringify(structuredData),
    } : undefined,
  };
}

export function generateBlogSEO(blog: {
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  tags: string[];
  author: { name: string };
  publishedAt: string;
  updatedAt?: string;
  featuredImage?: string;
  readingTime?: number;
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://compliancetracker.com';
  const canonicalUrl = `${baseUrl}/blog/${blog.slug}`;
  
  // Generate comprehensive keywords
  const keywords = [
    'healthcare compliance',
    'HIPAA compliance',
    'medical practice management',
    'healthcare documentation',
    'compliance tracking',
    blog.category,
    ...blog.tags,
    'healthcare regulations',
    'compliance automation',
    'medical compliance software'
  ];

  // Structured data for articles
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.excerpt,
    image: blog.featuredImage || `${baseUrl}/api/og?title=${encodeURIComponent(blog.title)}`,
    author: {
      '@type': 'Person',
      name: blog.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ComplianceTracker',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.svg`,
      },
    },
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    ...(blog.readingTime && {
      timeRequired: `PT${blog.readingTime}M`,
    }),
  };

  return generateSEOMetadata({
    title: `${blog.title} | ComplianceTracker Blog`,
    description: blog.excerpt,
    keywords,
    canonicalUrl,
    ogImage: blog.featuredImage,
    structuredData,
  });
}

export function generateBlogListSEO(): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://compliancetracker.com';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'ComplianceTracker Healthcare Compliance Blog',
    description: 'Expert insights on healthcare compliance, HIPAA regulations, and best practices for medical practices.',
    url: `${baseUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'ComplianceTracker',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.svg`,
      },
    },
  };

  return generateSEOMetadata({
    title: 'Healthcare Compliance Blog | Expert Insights & Best Practices | ComplianceTracker',
    description: 'Stay informed with the latest insights on healthcare compliance, HIPAA regulations, and best practices for medical practices. Expert guidance for healthcare professionals.',
    keywords: [
      'healthcare compliance blog',
      'HIPAA compliance guides',
      'medical practice management',
      'healthcare regulations',
      'compliance best practices',
      'healthcare documentation',
      'medical compliance training',
      'healthcare security',
      'patient privacy',
      'compliance automation'
    ],
    canonicalUrl: `${baseUrl}/blog`,
    structuredData,
  });
}
