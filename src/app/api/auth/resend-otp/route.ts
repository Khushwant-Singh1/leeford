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
    // 1. Validate the request body
    const body = await req.json();
    const validation = ResendOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { email: emailOrPhone } = validation.data;

    // 2. Apply rate limiting based on the email/phone address
    const ratelimit = getOtpRateLimiter();
    
    // Skip rate limiting if Redis is not available (e.g., during build)
    if (ratelimit) {
      const identifier = `resend-otp:${emailOrPhone}`; // Use email/phone for a user-specific limit
      const { success } = await ratelimit.limit(identifier);

      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a few minutes.' }, { status: 429 });
      }
    }

    // 3. Find the user but don't reveal if they exist (prevents user enumeration)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phoneNumber: emailOrPhone },
        ],
      },
    });

    // If the user doesn't exist OR is already verified, we send a generic success message.
    // This is a security best practice.
    if (!user || user.isVerified) {
      return NextResponse.json({ message: 'If an account with this email/phone exists and requires verification, a new OTP has been sent.' }, { status: 200 });
    }

    // 4. Invalidate all previous, unused OTPs for this user to prevent confusion
    await prisma.verificationCode.updateMany({
      where: { 
        OR: [
          { email: user.email || '' },
          { phoneNumber: user.phoneNumber || '' },
        ],
        isUsed: false 
      },
      data: { isUsed: true, expiresAt: new Date(0) }, // Expire immediately
    });

    // 5. Generate and send a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.verificationCode.create({
      data: { 
        code: otp, 
        email: user.email || undefined,
        phoneNumber: user.phoneNumber || undefined,
        expiresAt 
      },
    });

    if (user.email) {
      await sendOtpEmail(user.email, otp);
    }
    // TODO: Add SMS sending logic for phone numbers

    return NextResponse.json({ message: 'A new OTP has been sent to your email.' }, { status: 200 });

  } catch (error) {
    // Log the unexpected error for internal monitoring
    console.error('💥 Resend OTP Error:', error);
    // Return a generic error message to the client
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}