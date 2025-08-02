import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    organization: string;
    subscription?: {
      status: string;
      plan: string;
    };
  };
}

export async function requireAuth(
  request: NextRequest,
  requiredRole?: 'admin' | 'user'
): Promise<{ success: true; user: any } | { success: false; response: NextResponse }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }

    if (requiredRole && session.user.role !== requiredRole) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      };
    }

    return {
      success: true,
      user: session.user
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      success: false,
      response: NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    };
  }
}

export async function requireActiveSubscription(
  request: NextRequest
): Promise<{ success: true; user: any } | { success: false; response: NextResponse }> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }

  const { user } = authResult;

  if (!user.subscription || user.subscription.status !== 'active') {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Active subscription required' }, 
        { status: 402 }
      )
    };
  }

  return { success: true, user };
}

export async function requireAdmin(
  request: NextRequest
): Promise<{ success: true; user: any } | { success: false; response: NextResponse }> {
  return requireAuth(request, 'admin');
}
