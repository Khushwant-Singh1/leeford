// app/api/auth/verify-otp/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // 1. Find the most recent, non-used OTP for the email
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email: email,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc', // Get the latest one
      },
    });

    if (!verificationCode) {
      return NextResponse.json({ error: 'No pending OTP found. Please register again.' }, { status: 404 });
    }

    // 2. Check if the OTP has expired
    if (new Date() > verificationCode.expiresAt) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // 3. Check if the provided OTP is correct
    if (verificationCode.code !== otp) {
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
    }

    // 4. Update the user to mark them as verified
    await prisma.user.update({
      where: { email: email },
      data: {
        isVerified: true,
      },
    });

    // 5. Mark the OTP as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        isUsed: true,
      },
    });

    return NextResponse.json({ message: 'Email verified successfully! You can now log in.' }, { status: 200 });
  } catch (error) {
    console.error('💥 OTP Verification Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}