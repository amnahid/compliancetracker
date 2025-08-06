import { Metadata } from 'next';
import { generateBlogListSEO } from '@/lib/seo-utils';

export const metadata: Metadata = generateBlogListSEO();

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
