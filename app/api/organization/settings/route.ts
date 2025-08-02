import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/organization-utils';
import connectDB from '@/lib/mongodb';
import Organization from '@/lib/models/Organization';

// GET /api/organization/settings - Get organization settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { organization } = authResult;

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    await connectDB();

    const org = await Organization.findById(organization.id);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        description: org.description,
        domain: org.domain,
        settings: org.settings,
        subscription: org.subscription,
      }
    });
  } catch (error) {
    console.error('Get organization settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/organization/settings - Update organization settings
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthWithOrganization(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { organization, user } = authResult;

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Only admins can update organization settings
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      domain, 
      allowPublicSignup, 
      requireEmailVerification, 
      defaultRole 
    } = body;

    await connectDB();

    const org = await Organization.findById(organization.id);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if slug would change and if it's available
    if (name && name !== org.name) {
      const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const existingOrg = await Organization.findOne({ 
        slug: newSlug,
        _id: { $ne: org._id } 
      });
      
      if (existingOrg) {
        return NextResponse.json(
          { error: 'Organization name already taken' },
          { status: 400 }
        );
      }
      
      org.name = name;
      org.slug = newSlug;
    }

    // Update other fields
    if (description !== undefined) org.description = description;
    if (domain !== undefined) org.domain = domain;

    // Update settings
    if (org.settings) {
      if (allowPublicSignup !== undefined) org.settings.allowPublicSignup = Boolean(allowPublicSignup);
      if (requireEmailVerification !== undefined) org.settings.requireEmailVerification = Boolean(requireEmailVerification);
      if (defaultRole !== undefined) org.settings.defaultRole = defaultRole || 'user';
    }

    await org.save();

    return NextResponse.json({
      message: 'Organization settings updated successfully',
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
    console.error('Update organization settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
