// app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mailer'; // <-- Import the new helper
import { AuthMethod } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user but keep them unverified for now
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        authMethod: AuthMethod.EMAIL,
        isVerified: false,
      },
    });

    // 1. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Set an expiry time (e.g., 10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 3. Store the OTP in the VerificationCode table
    await prisma.verificationCode.create({
      data: {
        code: otp,
        email: user.email!,
        expiresAt: expiresAt,
      },
    });

    // 4. Send the OTP email
    await sendOtpEmail(user.email!, otp);

    return NextResponse.json(
      { message: 'User registered. An OTP has been sent to your email.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('💥 Registration Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}