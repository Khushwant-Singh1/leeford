import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as z from 'zod';

const acceptSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = acceptSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validation.error.issues
      }, { status: 400 });
    }
    const { token, firstName, lastName, password } = validation.data;

    const hashedToken = createHash('sha256').update(token).digest('hex');

    const invitation = await prisma.invitation.findUnique({
      where: { token: hashedToken },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 });
    }

    // Check if a user with this email already exists (race condition protection)
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use a transaction to ensure both operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Create the new user
      await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          firstName,
          lastName,
          role: invitation.role,
          isVerified: true, // User is verified by accepting the invitation
          authMethod: 'EMAIL',
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
    });

    return NextResponse.json({ 
      message: 'Account created successfully! You can now log in.',
      email: invitation.email
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
