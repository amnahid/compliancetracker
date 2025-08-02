import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Organization from '@/lib/models/Organization';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Organization Resolution Utility
 * 
 * This utility ensures consistent organization handling across all API endpoints.
 * It follows a two-step resolution pattern:
 * 1. Try session.user.organization first
 * 2. Fallback to database lookup if session organization is undefined
 * 
 * This solves the common issue where session data doesn't include organization
 * but the user has an organization assigned in the database.
 */

export interface AuthResult {
  success: boolean;
  response?: NextResponse;
  user?: {
    id: string;
    email: string;
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface OrganizationResult extends AuthResult {
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Get user's organization with proper fallback logic
 * @param session - NextAuth session object
 * @returns Organization object or null if not found
 */
export async function getUserOrganization(session: any): Promise<{id: string, name: string, slug: string} | null> {
  try {
    // Step 1: Try session organization first (if it's a populated object)
    if (session?.user?.organization && typeof session.user.organization === 'object') {
      console.log('Organization found in session:', session.user.organization);
      const org = session.user.organization as any;
      return {
        id: org._id || org.id,
        name: org.name,
        slug: org.slug
      };
    }

    // Step 2: Fallback to database lookup
    if (session?.user?.email) {
      await connectDB();
      const user = await User.findOne({ email: session.user.email }).populate('organization');
      
      if (user?.organization) {
        // Check if organization is a populated object (new structure)
        if (typeof user.organization === 'object' && (user.organization as any)._id) {
          console.log('Organization found in database (populated):', user.organization);
          const org = user.organization as any;
          return {
            id: org._id.toString(),
            name: org.name,
            slug: org.slug
          };
        } 
        // Handle legacy string organization (old structure)
        else if (typeof user.organization === 'string') {
          console.log('Legacy string organization found, needs migration:', user.organization);
          return null; // Force organization setup for legacy users
        }
      }
    }

    console.log('No organization found for user:', session?.user?.email);
    return null;
  } catch (error) {
    console.error('Error resolving user organization:', error);
    return null;
  }
}

/**
 * Require authentication and return user organization
 * @param request - NextRequest object (optional for logging)
 * @returns AuthResult with organization data
 */
export async function requireAuthWithOrganization(request?: NextRequest): Promise<OrganizationResult> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return {
        success: false,
        response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      };
    }

    const organization = await getUserOrganization(session);
    
    if (!organization) {
      return {
        success: false,
        response: NextResponse.json(
          { 
            message: 'No organization found. Please ensure your account has an organization assigned.',
            error: 'MISSING_ORGANIZATION',
            userEmail: session.user.email
          }, 
          { status: 400 }
        )
      };
    }

    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        organization
      },
      organization
    };

  } catch (error) {
    console.error('Error in requireAuthWithOrganization:', error);
    return {
      success: false,
      response: NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    };
  }
}

/**
 * Require admin authentication with organization
 * @param request - NextRequest object
 * @returns AuthResult with admin user and organization data
 */
export async function requireAdminWithOrganization(request: NextRequest): Promise<OrganizationResult> {
  try {
    const authResult = await requireAuthWithOrganization(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult;
    }

    // Check admin role
    if (authResult.user.role !== 'admin') {
      return {
        success: false,
        response: NextResponse.json(
          { message: 'Admin access required' },
          { status: 403 }
        )
      };
    }

    return authResult;
  } catch (error) {
    console.error('Error in requireAdminWithOrganization:', error);
    return {
      success: false,
      response: NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    };
  }
}

/**
 * Check if two users belong to the same organization
 * @param userEmail1 - First user's email
 * @param userEmail2 - Second user's email
 * @returns boolean indicating if they share an organization
 */
export async function usersShareOrganization(userEmail1: string, userEmail2: string): Promise<boolean> {
  try {
    await connectDB();
    
    const [user1, user2] = await Promise.all([
      User.findOne({ email: userEmail1 }),
      User.findOne({ email: userEmail2 })
    ]);

    if (!user1?.organization || !user2?.organization) {
      return false;
    }

    return user1.organization === user2.organization;
  } catch (error) {
    console.error('Error checking user organization membership:', error);
    return false;
  }
}

/**
 * Ensure user has a default organization if missing
 * @param userEmail - User's email address
 * @returns Updated organization or null if failed
 */
export async function ensureUserHasOrganization(userEmail: string): Promise<string | null> {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return null;
    }

    // If user already has organization, return it
    if (user.organization) {
      return user.organization;
    }

    // Create default organization from email domain
    const emailDomain = userEmail.split('@')[1];
    const defaultOrg = emailDomain ? 
      emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1) : 
      'My Organization';

    // Update user with default organization
    user.organization = defaultOrg;
    await user.save();

    console.log(`Assigned default organization "${defaultOrg}" to user: ${userEmail}`);
    return defaultOrg;

  } catch (error) {
    console.error('Error ensuring user has organization:', error);
    return null;
  }
}
