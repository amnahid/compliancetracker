import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    try {
      const { pathname } = req.nextUrl;
      const { token } = req.nextauth;

      console.log('🔥 MIDDLEWARE DEBUG:', {
        pathname,
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : 'NO TOKEN',
        userOrganization: token?.organization,
        userOrganizationType: typeof token?.organization,
        userEmail: token?.email,
        timestamp: new Date().toISOString()
      });

      // If user has no organization, redirect to organization setup (except for organization setup page)
      if (token && !token.organization && !pathname.startsWith('/organization/setup')) {
        console.log('🟡 MIDDLEWARE: No organization, redirecting to setup from:', pathname);
        const setupUrl = new URL('/organization/setup', req.url);
        return NextResponse.redirect(setupUrl);
      }

      // If user has organization but is on setup page, redirect to dashboard
      if (pathname.startsWith('/organization/setup') && token?.organization && typeof token.organization === 'object') {
        console.log('🟢 MIDDLEWARE: Has organization, redirecting from setup to dashboard');
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Admin routes protection
      if (pathname.startsWith('/admin') && token?.role !== 'admin') {
        console.log('🔴 MIDDLEWARE: Admin access denied, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      console.log('🟢 MIDDLEWARE: Allowing request to:', pathname);
      return NextResponse.next();
    } catch (error) {
      console.error('🔴 MIDDLEWARE ERROR:', error);
      // In case of error, allow the request to continue to avoid breaking the app
      return NextResponse.next();
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (pathname === '/' || pathname.startsWith('/auth/')) {
          return true;
        }
        
        // Require authentication for all other routes
        // If no token, user will be redirected to sign in
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes - they handle their own auth)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
