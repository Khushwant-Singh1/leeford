import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema for validating the incoming request
const CheckVerificationSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required.'),
});

export async function POST(req: Request) {
  try {
    // 1. Validate the request body
    const body = await req.json();
    const validation = CheckVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }
    
    const { emailOrPhone } = validation.data;

    // 2. Find the user by either email or phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phoneNumber: emailOrPhone },
        ],
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
      },
    });

    // 3. Handle different user states
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json({ 
        needsVerification: true,
        email: user.email,
        phoneNumber: user.phoneNumber,
        message: 'User account exists but is not verified'
      }, { status: 200 });
    }

    // User exists and is verified
    return NextResponse.json({ 
      verified: true,
      message: 'User account is verified'
    }, { status: 200 });

  } catch (error) {
    console.error('💥 Check verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while checking verification status.' },
      { status: 500 }
    );
  }
}
