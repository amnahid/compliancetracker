import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Organization from '@/lib/models/Organization';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).populate('organization');
    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const organization = await Organization.findById(user.organization)
      .populate('owner', '_id name email')
      .populate('members', '_id name email role')
      .lean();

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const org = organization as any;
    
    return NextResponse.json({
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        description: org.description,
        domain: org.domain,
        owner: {
          id: org.owner._id.toString(),
          name: org.owner.name,
          email: org.owner.email
        },
        members: org.members.map((member: any) => ({
          id: member._id.toString(),
          name: member.name,
          email: member.email,
          role: member.role
        })),
        settings: org.settings,
        subscription: org.subscription,
      },
      currentUserId: user._id.toString()
    });
  } catch (error) {
    console.error('Get organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { name, description, domain, allowPublicSignup, requireEmailVerification, defaultRole } = await request.json();

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).populate('organization');
    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const organization = await Organization.findById(user.organization);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user is owner
    if (organization.owner.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Only organization owner can update settings' },
        { status: 403 }
      );
    }

    // Validate domain format if provided
    if (domain && !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Check if domain is already taken by another organization
    if (domain && domain !== organization.domain) {
      const existingOrgWithDomain = await Organization.findOne({ 
        domain, 
        _id: { $ne: organization._id } 
      });
      if (existingOrgWithDomain) {
        return NextResponse.json(
          { error: 'This domain is already registered to another organization' },
          { status: 400 }
        );
      }
    }

    // Update organization
    organization.name = name.trim();
    organization.description = description?.trim() || '';
    organization.domain = domain?.toLowerCase() || undefined;
    organization.settings = {
      allowPublicSignup: Boolean(allowPublicSignup),
      requireEmailVerification: Boolean(requireEmailVerification),
      defaultRole: defaultRole || 'user',
    };

    await organization.save();
    
    const org = organization as any;

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        description: org.description,
        domain: org.domain,
        settings: org.settings,
      }
    });
  } catch (error) {
    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
