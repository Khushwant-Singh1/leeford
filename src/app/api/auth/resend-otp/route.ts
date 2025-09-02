import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOtpEmail } from '@/lib/mailer';
import { getOtpRateLimiter } from '@/lib/rate-limiter';
import { z } from 'zod';

// Schema for validating the incoming request
const ResendOtpSchema = z.object({
  email: z.string().min(1, 'Email or phone number is required.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = ResendOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { email: emailOrPhone } = validation.data;

    // Apply rate limiting
    const ratelimit = getOtpRateLimiter();
    if (ratelimit) {
      const identifier = `resend-otp:${emailOrPhone}`;
      const { success } = await ratelimit.limit(identifier);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a few minutes.' }, { status: 429 });
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
      },
    });

    if (!user || user.isVerified) {
      return NextResponse.json({ message: 'If an account exists and requires verification, a new OTP has been sent.' }, { status: 200 });
    }

    // Invalidate previous OTPs
    await prisma.verificationCode.updateMany({
      where: { 
        OR: [
          { email: user.email },
          { phoneNumber: user.phoneNumber },
        ].filter(c => c.email || c.phoneNumber), // Filter out null/undefined conditions
        isUsed: false 
      },
      data: { isUsed: true, expiresAt: new Date(0) },
    });

    // Generate and send a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // --- THIS IS THE CORRECTED PART ---
    await prisma.verificationCode.create({
      data: { 
        code: otp, 
        email: user.email || null, // Use null instead of undefined
        phoneNumber: user.phoneNumber || null, // Use null instead of undefined
        expiresAt 
      },
    });
    // --- END OF CORRECTION ---

    if (user.email) {
      await sendOtpEmail(user.email, otp);
    }
    // TODO: Add SMS sending logic for phone numbers

    return NextResponse.json({ message: 'A new OTP has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('💥 Resend OTP Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}