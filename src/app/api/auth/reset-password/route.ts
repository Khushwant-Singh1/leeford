import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import * as z from 'zod';
import { createHash } from 'crypto';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      // ... (logging is fine)
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { token, newPassword } = validation.data;

    // 1. Hash the plaintext token from the request to match what's in the DB
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // 2. Find the user using the HASHED token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken, // Find user by the specific token
        resetTokenExpiry: {
          gt: new Date(), // And ensure it's not expired
        },
      },
    });

    // 3. If no user is found with that valid token, it's invalid.
    if (!user) {
      // ... (logging is fine)
      return NextResponse.json({ error: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    // No need to bcrypt.compare here, as the database query already confirmed the token match.

    // 4. Hash the new password and update the user
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null, // Invalidate the token
        resetTokenExpiry: null, // Clear expiry
      },
    });

    // await AuthLogger.passwordResetSuccess(user.id, user.email || '', req);

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });
  } catch (error) {
    // ... (error handling is fine)
    console.error('💥 Password Reset Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}