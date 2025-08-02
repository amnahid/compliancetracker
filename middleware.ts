import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Debug logging for organization setup issues
    if (token) {
      console.log('Middleware - Request details:', {
        pathname,
        userEmail: token.email,
        userRole: token.role,
        hasOrganization: !!token.organization,
        organizationType: typeof token.organization,
        organizationData: token.organization
      });
    }

    // Check if user needs organization setup (null organization or legacy string organization)
    if (token && (!token.organization || typeof token.organization === 'string') && !pathname.startsWith('/organization/setup') && !pathname.startsWith('/auth') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/organization/setup') && !pathname.startsWith('/api/organization/migrate')) {
      console.log('Middleware - Redirecting to organization setup:', {
        email: token.email,
        organization: token.organization,
        pathname
      });
      return NextResponse.redirect(new URL('/organization/setup', req.url));
    }

    // Prevent access to organization setup if user already has proper organization
    if (pathname.startsWith('/organization/setup') && token?.organization && typeof token.organization === 'object') {
      console.log('Middleware - Redirecting from setup to dashboard (has organization):', {
        email: token.email,
        organization: token.organization
      });
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Admin routes protection
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Staff management protection (admin only)
    if (pathname.startsWith('/dashboard/staff') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Dashboard routes protection - require authentication
    if (pathname.startsWith('/dashboard') && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Organization routes protection - require authentication
    if (pathname.startsWith('/organization') && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Billing routes protection - require active subscription for some features
    if (pathname.startsWith('/dashboard/billing') && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/organization/setup') ||
          pathname.startsWith('/api/organization/setup') ||
          pathname.startsWith('/api/organization/migrate') ||
          pathname.startsWith('/pricing') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname.startsWith('/static') ||
          (process.env.NODE_ENV === 'development' && pathname.startsWith('/api/debug'))
        ) {
          return true;
        }

        // API routes that need authentication
        if (pathname.startsWith('/api/admin') || 
            pathname.startsWith('/api/stripe') ||
            pathname.startsWith('/api/user')) {
          return !!token;
        }

        // Dashboard and admin routes require authentication
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
          return !!token;
        }

        // Default to requiring authentication for unlisted routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/stripe/:path*',
    '/api/user/:path*',
    '/((?!auth|_next/static|_next/image|favicon.ico|$).*)',
  ],
};