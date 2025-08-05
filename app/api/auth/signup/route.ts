import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organization, invitationToken } = await request.json();

    let finalOrganization = organization;
    let finalRole = 'user';
    let invitation = null;
    let existingOrganization = null;

    // If invitation token is provided, validate and use invitation data
    if (invitationToken) {
      await connectDB();
      ensureModelsRegistered();
      
      const Invitation = getModel('Invitation');
      invitation = await Invitation.findOne({
        token: invitationToken,
        status: 'pending'
      }).populate('organization');

      console.log(` Invitation found: ${invitation}`);

      if (!invitation) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation' },
          { status: 400 }
        );
      }

      if (invitation.expiresAt < new Date()) {
        invitation.status = 'expired';
        await invitation.save();
        return NextResponse.json(
          { error: 'Invitation has expired' },
          { status: 400 }
        );
      }

      if (invitation.email !== email) {
        return NextResponse.json(
          { error: 'Email does not match invitation' },
          { status: 400 }
        );
      }

      // Use invitation data
      existingOrganization = invitation.organization;
      console.log(`existingOrganization: ${existingOrganization ? existingOrganization.name : 'None'}`);
      finalRole = invitation.role;
    }

    // For regular signup (not invitation), organization name is required
    if (!invitationToken && (!finalOrganization || finalOrganization.trim().length < 2)) {
      return NextResponse.json(
        { error: 'Organization name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();
    ensureModelsRegistered();

    const User = getModel('User');
    const Organization = getModel('Organization');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let userOrganization;
    let createdOrganization;

    console.log(`Final organization: ${finalOrganization}`);
    console.log(`Existing organization: ${existingOrganization ? existingOrganization.name : 'None'}`);

    if (existingOrganization) {
      // User is joining existing organization via invitation
      userOrganization = existingOrganization._id;
    } else {
      // Create new organization for the user
      const slug = finalOrganization.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let slugCounter = 0;
      let finalSlug = slug;
      
      while (await Organization.findOne({ slug: finalSlug })) {
        slugCounter++;
        finalSlug = `${slug}-${slugCounter}`;
      }

      // Set trial end date to 14 days from now
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      createdOrganization = await Organization.create({
        name: finalOrganization.trim(),
        slug: finalSlug,
        settings: {
          allowPublicSignup: false,
          requireEmailVerification: true,
          defaultRole: 'user',
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

      userOrganization = createdOrganization._id;
      finalRole = 'admin'; // Organization creator becomes admin
    }

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      organization: userOrganization,
      role: finalRole,
      provider: 'credentials',
    });

    // Add user to organization members if joining existing organization
    if (existingOrganization) {
      await Organization.findByIdAndUpdate(
        existingOrganization._id,
        { 
          $addToSet: { members: user._id },
          $inc: { 'subscription.usedSeats': 1 }
        }
      );
    } else if (createdOrganization) {
      // Set user as owner and add to members for new organization
      await Organization.findByIdAndUpdate(
        createdOrganization._id,
        { 
          owner: user._id,
          $addToSet: { members: user._id }
        }
      );
    }

    // Mark invitation as accepted if it was used
    if (invitation) {
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      await invitation.save();
    }

    // Send welcome email and verification email if needed
    try {
      await sendWelcomeEmail(email, name);
      
      // Check if organization requires email verification
      const userOrg = existingOrganization || createdOrganization;
      if (userOrg && userOrg.settings && userOrg.settings.requireEmailVerification) {
        // Generate verification token
        const verificationToken = jwt.sign(
          { email, userId: user._id },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: '24h' }
        );
        
        await sendVerificationEmail(email, name, verificationToken);
      } else {
        // If verification not required, mark as verified immediately
        user.emailVerified = new Date();
        await user.save();
      }
    } catch (emailError) {
      console.error('Failed to send emails:', emailError);
      // Don't fail the signup if email sending fails
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          organization: userOrganization,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

