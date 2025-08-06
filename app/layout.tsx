import './globals.css';
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/auth-provider';

const openSans = Open_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans'
});

export const metadata: Metadata = {
  title: {
    default: 'ComplianceTracker - Healthcare Compliance Management',
    template: '%s | ComplianceTracker'
  },
  description: 'Streamline healthcare compliance with automated task tracking, document management, and regulatory oversight for medical practices.',
  keywords: 'healthcare compliance, HIPAA compliance, medical practice management, compliance tracking, healthcare documentation, regulatory compliance, medical software, healthcare automation',
  authors: [{ name: 'ComplianceTracker Team' }],
  creator: 'ComplianceTracker',
  publisher: 'ComplianceTracker',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/logo.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'ComplianceTracker - Healthcare Compliance Management',
    description: 'Streamline healthcare compliance with automated task tracking, document management, and regulatory oversight for medical practices.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'ComplianceTracker',
    images: [
      {
        url: process.env.NEXT_PUBLIC_OG_IMAGE_URL || '/api/og',
        width: 1200,
        height: 630,
        alt: 'Healthcare Compliance Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ComplianceTracker - Healthcare Compliance Management',
    description: 'Streamline healthcare compliance with automated task tracking, document management, and regulatory oversight for medical practices.',
    images: [process.env.NEXT_PUBLIC_OG_IMAGE_URL || '/api/og'],
    creator: '@ComplianceTracker',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={openSans.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}