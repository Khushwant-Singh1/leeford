import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

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
      // Mark as expired in database
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 });
    }

    return NextResponse.json({ 
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
