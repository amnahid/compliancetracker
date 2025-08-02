import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Admin upgrade feature has been disabled for security reasons. Please contact your system administrator.' 
    },
    { status: 403 }
  );
}


