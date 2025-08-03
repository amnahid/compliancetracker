import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { name, description, domain, allowPublicSignup, requireEmailVerification, defaultRole } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Organization name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Validate domain format if provided
    if (domain && !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    await connectDB();
    ensureModelsRegistered();

    const User = getModel('User');
    const Organization = getModel('Organization');

    // Get the current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has an organization (ObjectId reference)
    if (user.organization && typeof user.organization === 'object') {
      return NextResponse.json(
        { error: 'User already belongs to an organization' },
        { status: 400 }
      );
    }

    // Check if domain is already taken
    if (domain) {
      const existingOrgWithDomain = await Organization.findOne({ domain });
      if (existingOrgWithDomain) {
        return NextResponse.json(
          { error: 'This domain is already registered to another organization' },
          { status: 400 }
        );
      }
    }

    // Generate unique slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    let slugCounter = 0;
    let finalSlug = slug;
    
    while (await Organization.findOne({ slug: finalSlug })) {
      slugCounter++;
      finalSlug = `${slug}-${slugCounter}`;
    }

    // Set trial end date to 14 days from now
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create organization
    const organization = await Organization.create({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || '',
      domain: domain?.toLowerCase() || undefined,
      owner: user._id,
      members: [user._id],
      settings: {
        allowPublicSignup: Boolean(allowPublicSignup),
        requireEmailVerification: Boolean(requireEmailVerification),
        defaultRole: defaultRole || 'user',
      },
      subscription: {
        status: 'trialing',
        plan: process.env.DEFAULT_PLAN_NAME || 'healthcare_compliance',
        seats: 5,
        usedSeats: 1,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
        trialStart: new Date(),
        trialEnd: trialEndsAt,
      },
    });

    // Update user to reference the organization and make them admin
    await User.findByIdAndUpdate(user._id, {
      organization: organization._id,
      role: 'admin', // Organization creator becomes admin
    });

    const org = organization as any;

    return NextResponse.json(
      { 
        message: 'Organization created successfully',
        organization: {
          id: org._id.toString(),
          name: org.name,
          slug: org.slug,
          domain: org.domain,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Organization setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
