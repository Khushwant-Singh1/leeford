import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { SECURITY_EVENTS, AuthLogger, logSecurityEventWithRequest } from '@/lib/security-logger';
import { SecurityEventLevel } from '@prisma/client';
import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as z from 'zod';

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = requestResetSchema.safeParse(body);

    if (!validation.success) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.SYSTEM_WARNING,
        {
          errors: validation.error.flatten().fieldErrors,
          email: body.email,
          context: 'password_reset_request_validation'
        },
        SecurityEventLevel.WARN
      );
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return a generic success message to prevent email enumeration
    if (!user) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.SYSTEM_WARNING,
        { 
          email,
          reason: 'email_not_found',
          context: 'password_reset_request'
        },
        SecurityEventLevel.WARN
      );
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate a secure, single-use reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10); // Hash the token before storing
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry: resetTokenExpiry,
      },
    });

    // Send the reset email with the unhashed token
    await sendPasswordResetEmail(email, resetToken);

    await AuthLogger.passwordResetRequested(email, req);

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('💥 Password Reset Request Error:', error);
    await logSecurityEventWithRequest(
      req,
      SECURITY_EVENTS.SYSTEM_ERROR,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'password_reset_request'
      },
      SecurityEventLevel.ERROR
    );
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}