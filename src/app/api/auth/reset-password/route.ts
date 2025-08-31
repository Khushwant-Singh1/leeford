import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { SECURITY_EVENTS, AuthLogger, logSecurityEventWithRequest } from '@/lib/security-logger';
import { SecurityEventLevel } from '@prisma/client';
import * as z from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.SYSTEM_WARNING,
        {
          errors: validation.error.flatten().fieldErrors,
          token: body.token,
          context: 'password_reset_validation'
        },
        SecurityEventLevel.WARN
      );
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { token, newPassword } = validation.data;

    const user = await prisma.user.findFirst({
      where: {
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user || !user.resetToken) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.AUTH_UNAUTHORIZED_ACCESS,
        { 
          token,
          reason: 'invalid_or_expired_token',
          context: 'password_reset'
        },
        SecurityEventLevel.WARN
      );
      return NextResponse.json({ error: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    // Compare the provided token with the hashed token in the database
    const isTokenValid = await bcrypt.compare(token, user.resetToken);

    if (!isTokenValid) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.AUTH_UNAUTHORIZED_ACCESS,
        { 
          userId: user.id, 
          token,
          reason: 'invalid_token_match',
          context: 'password_reset'
        },
        SecurityEventLevel.ERROR
      );
      return NextResponse.json({ error: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null, // Invalidate the token
        resetTokenExpiry: null, // Clear expiry
      },
    });

    await AuthLogger.passwordResetSuccess(user.id, user.email || '', req);

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });
  } catch (error) {
    console.error('💥 Password Reset Error:', error);
    await logSecurityEventWithRequest(
      req,
      SECURITY_EVENTS.SYSTEM_ERROR,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'password_reset'
      },
      SecurityEventLevel.ERROR
    );
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}