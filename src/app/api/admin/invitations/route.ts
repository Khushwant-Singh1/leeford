import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdmin } from '@/lib/auth-helper';
import { Role } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { sendInvitationEmail } from '@/lib/mailer';
import * as z from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

export async function POST(req: Request) {
  try {
    const admin = await checkAdmin();

    const body = await req.json();
    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { email, role } = validation.data;

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }
    
    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.Invitation.findUnique({ 
      where: { email } 
    });
    
    if (existingInvitation && existingInvitation.status === 'PENDING' && existingInvitation.expiresAt > new Date()) {
      return NextResponse.json({ error: 'An active invitation for this email has already been sent.' }, { status: 409 });
    }

    // If there's an expired or accepted invitation, delete it first
    if (existingInvitation) {
      await prisma.invitation.delete({ where: { id: existingInvitation.id } });
    }

    // Generate secure token
    const inviteToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(inviteToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create invitation record
    await prisma.invitation.create({
      data: {
        email,
        role,
        token: hashedToken,
        expiresAt,
        invitedById: admin.id,
      },
    });

    // Send invitation email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${inviteToken}`;
    await sendInvitationEmail(email, invitationUrl, role);

    return NextResponse.json({ 
      message: 'Invitation sent successfully.',
      email,
      role,
      expiresAt: expiresAt.toISOString()
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error sending invitation:', error);
    
    if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    if (error.message === 'Forbidden: Insufficient privileges') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// GET endpoint to list all invitations (for admin management)
export async function GET(req: Request) {
  try {
    await checkAdmin();

    const invitations = await prisma.invitation.findMany({
      include: {
        invitedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invitations }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    
    if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    if (error.message === 'Forbidden: Insufficient privileges') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
