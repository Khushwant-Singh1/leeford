// app/api/auth/verify-otp/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { timingSafeEqual, createHash, randomBytes } from 'crypto';
import { getOtpRateLimiter } from '@/lib/rate-limiter';
import { SECURITY_EVENTS, AuthLogger, logSecurityEventWithRequest } from '@/lib/security-logger';
import { SecurityEventLevel } from '@prisma/client';

// Generate a secure random token for session
function generateSessionToken() {
  return randomBytes(32).toString('hex');
}

// Schema validation
const VerifyOtpSchema = z.object({
  email: z.string().min(1, 'Email or phone number is required'),
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

    const { email: emailOrPhone, otp } = validationResult.data;
    const normalizedEmailOrPhone = emailOrPhone.toLowerCase().trim();

    // Check rate limiting using Upstash Redis
    const ratelimiter = getOtpRateLimiter();
    const { success, limit, reset, remaining } = await ratelimiter.limit(`otp:${normalizedEmailOrPhone}`);
    
    if (!success) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
        { 
          emailOrPhone: normalizedEmailOrPhone,
          limit,
          reset,
          remaining,
          context: 'otp_verification'
        },
        SecurityEventLevel.WARN
      );
      
      return NextResponse.json(
        { error: OtpError.RateLimited },
        { status: 429 }
      );
    }

    // Check if user is already verified
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmailOrPhone },
          { phoneNumber: normalizedEmailOrPhone },
        ],
      },
      select: { id: true, email: true, phoneNumber: true, isVerified: true }
    });

    if (user?.isVerified) {
      return NextResponse.json({ message: OtpError.AlreadyVerified }, { status: 200 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Find the most recent, non-used OTP for the email/phone
      const verificationCode = await tx.verificationCode.findFirst({
        where: {
          OR: [
            { email: normalizedEmailOrPhone },
            { phoneNumber: normalizedEmailOrPhone },
          ],
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
        await logSecurityEventWithRequest(
          req,
          SECURITY_EVENTS.AUTH_OTP_FAILED,
          { 
            emailOrPhone: normalizedEmailOrPhone,
            reason: 'no_valid_otp_found'
          },
          SecurityEventLevel.WARN
        );
        throw new Error(OtpError.NoValidOtp);
      }

      // Check if OTP has exceeded maximum attempts
      if (verificationCode.attempts >= 5) {
        await logSecurityEventWithRequest(
          req,
          SECURITY_EVENTS.AUTH_OTP_FAILED,
          { 
            emailOrPhone: normalizedEmailOrPhone,
            verificationCodeId: verificationCode.id,
            reason: 'max_attempts_exceeded',
            attempts: verificationCode.attempts
          },
          SecurityEventLevel.ERROR
        );
        
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

        await AuthLogger.otpFailed(normalizedEmailOrPhone, verificationCode.attempts + 1, req);
        
        throw new Error(OtpError.InvalidAttempt);
      }

      // Update user verification status and mark OTP as used
      const [updatedUser] = await Promise.all([
        tx.user.update({
          where: { id: user!.id },
          data: { isVerified: true },
          select: { id: true, email: true, phoneNumber: true, firstName: true, lastName: true, role: true },
        }),
        tx.verificationCode.update({
          where: { id: verificationCode.id },
          data: { isUsed: true, usedAt: new Date() },
        }),
      ]);

      await AuthLogger.otpVerified(updatedUser.id, normalizedEmailOrPhone, req);

      return {
        user: updatedUser,
      };
    });

    // Set the session token as an HTTP-only cookie
    const response = NextResponse.json(
      { 
        message: 'Email verified successfully!',
        user: { 
          id: result.user.id, 
          email: result.user.email, 
          phoneNumber: result.user.phoneNumber,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role
        }
      },
      { status: 200 }
    );

    return response;

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
    await logSecurityEventWithRequest(
      req,
      SECURITY_EVENTS.SYSTEM_ERROR,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'otp_verification'
      },
      SecurityEventLevel.ERROR
    );
    
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}