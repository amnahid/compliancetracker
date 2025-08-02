'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  fallbackUrl?: string;
  requireSubscription?: boolean;
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  fallbackUrl = '/dashboard',
  requireSubscription = false 
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push(fallbackUrl);
      return;
    }

    if (requireSubscription && (!(session.user as any).subscription || (session.user as any).subscription?.status !== 'active')) {
      router.push('/dashboard/billing');
      return;
    }
  }, [session, status, router, requiredRole, fallbackUrl, requireSubscription]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null; // Will redirect via useEffect
  }

  // Role check failed
  if (requiredRole && session.user.role !== requiredRole) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <Button onClick={() => router.push(fallbackUrl)}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Subscription check failed
  if (requireSubscription && (!(session.user as any).subscription || (session.user as any).subscription?.status !== 'active')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">Subscription Required</h3>
            <p className="text-gray-600 mb-4">
              You need an active subscription to access this feature.
            </p>
            <Button onClick={() => router.push('/dashboard/billing')}>
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
