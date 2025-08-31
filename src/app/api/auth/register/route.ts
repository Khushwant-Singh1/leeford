// app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mailer';
import { AuthMethod } from '@prisma/client';
import { SECURITY_EVENTS, AuthLogger, logSecurityEventWithRequest } from '@/lib/security-logger';
import { SecurityEventLevel } from '@prisma/client';
import * as z from 'zod';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.SYSTEM_WARNING,
        {
          errors: validation.error.flatten().fieldErrors,
          email: body.email,
          context: 'user_registration_validation'
        },
        SecurityEventLevel.WARN
      );
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, firstName, lastName } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.SYSTEM_WARNING,
        { 
          email,
          reason: 'email_already_exists',
          context: 'user_registration'
        },
        SecurityEventLevel.WARN
      );
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Invalidate all previous OTPs for this email if any exist (e.g., if user started registration but didn't complete)
    await prisma.verificationCode.updateMany({
      where: { email: email, isUsed: false },
      data: { isUsed: true, expiresAt: new Date(0) } // Expire immediately
    });

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

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set an expiry time (e.g., 10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store the OTP in the VerificationCode table
    await prisma.verificationCode.create({
      data: {
        code: otp,
        email: user.email!,
        expiresAt: expiresAt,
      },
    });

    // Send the OTP email
    await sendOtpEmail(user.email!, otp);

    await AuthLogger.otpSent(user.email!, req);

    return NextResponse.json(
      { message: 'User registered. An OTP has been sent to your email.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('💥 Registration Error:', error);
    await logSecurityEventWithRequest(
      req,
      SECURITY_EVENTS.SYSTEM_ERROR,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'user_registration'
      },
      SecurityEventLevel.ERROR
    );
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}