import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mailer';

// Schema for validating the incoming request
const LoginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export async function POST(req: Request) {
  try {
    // 1. Validate the request body
    const body = await req.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { emailOrPhone, password } = validation.data;

    // 2. Find the user by either email or phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phoneNumber: emailOrPhone },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 4. Check if user is verified
    if (!user.isVerified) {
      // Generate a new OTP and send it
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate all previous OTPs for this user
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

      // Create new OTP
      await prisma.verificationCode.create({
        data: { 
          code: otp, 
          email: user.email || undefined,
          phoneNumber: user.phoneNumber || undefined,
          expiresAt 
        },
      });

      // Send OTP email
      if (user.email) {
        await sendOtpEmail(user.email, otp);
      }

      return NextResponse.json({ 
        needsVerification: true,
        email: user.email,
        message: 'Your account is not verified. A new OTP has been sent to your email.'
      }, { status: 200 });
    }

    // 5. User is verified, credentials are correct
    return NextResponse.json({ 
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      message: 'Login credentials verified. Proceed with NextAuth login.'
    }, { status: 200 });

  } catch (error) {
    console.error('💥 Login check error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
