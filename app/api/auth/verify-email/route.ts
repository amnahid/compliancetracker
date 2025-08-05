import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ensureModelsRegistered, getModel } from '@/lib/model-registry';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        error: 'Verification token is required'
      }, { status: 400 });
    }

    await connectDB();
    ensureModelsRegistered();

    const User = getModel('User');

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      
      if (!decoded.email) {
        return NextResponse.json({
          error: 'Invalid verification token'
        }, { status: 400 });
      }

      // Find the user and mark as verified
      const user = await User.findOne({ email: decoded.email });
      
      if (!user) {
        return NextResponse.json({
          error: 'User not found'
        }, { status: 404 });
      }

      if (user.emailVerified) {
        return NextResponse.json({
          message: 'Email already verified',
          verified: true
        });
      }

      // Mark email as verified
      user.emailVerified = new Date();
      await user.save();

      return NextResponse.json({
        message: 'Email verified successfully',
        verified: true
      });

    } catch (jwtError) {
      return NextResponse.json({
        error: 'Invalid or expired verification token'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
