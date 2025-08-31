import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { SECURITY_EVENTS, AuthLogger, logSecurityEventWithRequest } from '@/lib/security-logger';
import { SecurityEventLevel } from '@prisma/client';
import * as z from 'zod';
import { auth } from '@/lib/auth'; // Import the auth function

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      await AuthLogger.unauthorizedAccess('/api/auth/change-password', undefined, req);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.SYSTEM_WARNING,
        {
          userId: session.user.id,
          email: session.user.email,
          errors: validation.error.flatten().fieldErrors,
          context: 'change_password_validation'
        },
        SecurityEventLevel.WARN
      );
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.SYSTEM_ERROR,
        {
          userId: session.user.id,
          email: session.user.email,
          reason: 'user_not_found_in_database',
          context: 'change_password'
        },
        SecurityEventLevel.ERROR
      );
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordCorrect) {
      await logSecurityEventWithRequest(
        req,
        SECURITY_EVENTS.AUTH_LOGIN_FAILED,
        {
          userId: user.id,
          email: user.email || '',
          reason: 'invalid_current_password',
          context: 'change_password'
        },
        SecurityEventLevel.WARN
      );
      return NextResponse.json({ error: 'Invalid current password.' }, { status: 400 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
      },
    });

    await AuthLogger.passwordChanged(user.id, user.email || '', req);

    return NextResponse.json({ message: 'Password changed successfully.' }, { status: 200 });
  } catch (error) {
    console.error('💥 Change Password Error:', error);
    const session = await auth();
    await logSecurityEventWithRequest(
      req,
      SECURITY_EVENTS.SYSTEM_ERROR,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: session?.user?.id,
        email: session?.user?.email,
        context: 'change_password'
      },
      SecurityEventLevel.ERROR
    );
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}