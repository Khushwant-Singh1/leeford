import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';

const ForgotPasswordSchema = z.object({
  email: z.string().email('A valid email is required.'),
});

export async function POST(req: Request) {
  try {
    // 1. Validate the request body
    const body = await req.json();
    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { email } = validation.data;

    // 2. Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // 3. SECURITY: If no user is found, DO NOT send an error.
    // This prevents "user enumeration," where an attacker can guess valid emails.
    // We send a generic success message in both cases.
    if (user) {
      // 4. Generate a secure, random token for the user
      const resetToken = randomBytes(32).toString('hex');
      
      // 5. Hash the token before storing it in the database for security
      const hashedToken = createHash('sha256').update(resetToken).digest('hex');
      
      // 6. Set an expiry time for the token (e.g., 1 hour from now)
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: tokenExpiry,
        },
      });

      // 7. Construct the full reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
      
      // 8. Send the email containing the reset link
      await sendPasswordResetEmail(email, resetUrl);
    }

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('💥 Forgot Password Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}