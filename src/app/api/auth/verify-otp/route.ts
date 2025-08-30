// app/api/auth/verify-otp/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { timingSafeEqual, createHash } from 'crypto';
import { getOtpRateLimiter } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';

// Schema validation
const VerifyOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().min(6, 'OTP must be at least 6 characters').max(6, 'OTP cannot exceed 6 characters'),
});

// Error enum for consistent error messages
enum OtpError {
  NoValidOtp = 'No valid OTP found. Please request a new one.',
  InvalidAttempt = 'Invalid OTP.',
  MaxAttemptsExceeded = 'Too many failed attempts. Please request a new OTP.',
  AlreadyVerified = 'Account is already verified.',
  RateLimited = 'Too many attempts. Please try again later.',
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = VerifyOtpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { email, otp } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limiting using Upstash Redis
    const ratelimiter = getOtpRateLimiter();
    const { success, limit, reset, remaining } = await ratelimiter.limit(`otp:${normalizedEmail}`);
    
    if (!success) {
      await logSecurityEvent('OTP_RATE_LIMIT_EXCEEDED', { 
        email: normalizedEmail,
        limit,
        reset,
        remaining 
      });
      
      return NextResponse.json(
        { error: OtpError.RateLimited },
        { status: 429 }
      );
    }

    // Check if user is already verified
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isVerified: true }
    });

    if (user?.isVerified) {
      return NextResponse.json({ message: OtpError.AlreadyVerified }, { status: 200 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Find the most recent, non-used OTP for the email
      const verificationCode = await tx.verificationCode.findFirst({
        where: {
          email: normalizedEmail,
          isUsed: false,
          expiresAt: {
            gt: new Date(), // Not expired
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          code: true,
          attempts: true,
          expiresAt: true,
        },
      });

      if (!verificationCode) {
        await logSecurityEvent('OTP_NOT_FOUND', { email: normalizedEmail });
        throw new Error(OtpError.NoValidOtp);
      }

      // Check if OTP has exceeded maximum attempts
      if (verificationCode.attempts >= 5) {
        await logSecurityEvent('OTP_MAX_ATTEMPTS_EXCEEDED', { 
          email: normalizedEmail,
          verificationCodeId: verificationCode.id 
        });
        
        // Mark as used to prevent further attempts
        await tx.verificationCode.update({
          where: { id: verificationCode.id },
          data: { isUsed: true },
        });
        
        throw new Error(OtpError.MaxAttemptsExceeded);
      }

      // Use timing-safe comparison for OTP validation
      const expectedHash = createHash('sha256').update(verificationCode.code).digest();
      const actualHash = createHash('sha256').update(otp).digest();
      
      if (!timingSafeEqual(expectedHash, actualHash)) {
        // Increment attempt counter
        await tx.verificationCode.update({
          where: { id: verificationCode.id },
          data: { attempts: { increment: 1 } },
        });

        await logSecurityEvent('OTP_INVALID_ATTEMPT', { 
          email: normalizedEmail,
          verificationCodeId: verificationCode.id,
          attemptNumber: verificationCode.attempts + 1
        });
        
        throw new Error(OtpError.InvalidAttempt);
      }

      // Update user verification status and mark OTP as used
      const [updatedUser] = await Promise.all([
        tx.user.update({
          where: { email: normalizedEmail },
          data: { isVerified: true },
          select: { id: true, email: true, firstName: true, lastName: true },
        }),
        tx.verificationCode.update({
          where: { id: verificationCode.id },
          data: { isUsed: true, usedAt: new Date() },
        }),
      ]);

      await logSecurityEvent('OTP_VERIFICATION_SUCCESS', { 
        userId: updatedUser.id,
        email: normalizedEmail 
      });

      return updatedUser;
    });

    return NextResponse.json(
      { 
        message: 'Email verified successfully! You can now log in.',
        user: { 
          id: result.id, 
          email: result.email, 
          firstName: result.firstName,
          lastName: result.lastName
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('💥 OTP Verification Error:', error);
    
    if (error instanceof Error) {
      // Handle known error messages
      if (error.message === OtpError.NoValidOtp) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message === OtpError.InvalidAttempt) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message === OtpError.MaxAttemptsExceeded) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message === OtpError.AlreadyVerified) {
        return NextResponse.json(
          { message: error.message },
          { status: 200 }
        );
      }
    }

    // Generic error for unknown cases
    await logSecurityEvent('OTP_VERIFICATION_ERROR', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}