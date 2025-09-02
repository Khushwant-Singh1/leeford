import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdmin } from '@/lib/auth-helper';
import * as z from 'zod';
import { Role, Prisma } from '@prisma/client';

// Schema for updating a user. All fields are optional.
const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  isVerified: z.boolean().optional(),
});

/**
 * GET /api/admin/users/[id]
 * Gets a single user's details.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await checkAdmin();
    
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true, email: true, phoneNumber: true, firstName: true, lastName: true, role: true, isVerified: true, createdAt: true, updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);

  } catch (error: any) {
     if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }
    if (error.message === 'Forbidden: Insufficient privileges') {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Updates a user's details.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await checkAdmin();

    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: validation.data,
      select: {
         id: true, email: true, firstName: true, lastName: true, role: true, isVerified: true, createdAt: true
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error: any) {
    // Handle specific Prisma error for user not found
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
     if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }
    if (error.message === 'Forbidden: Insufficient privileges') {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Deletes a user.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin();

    // Safety check: prevent an admin from deleting their own account
    if (admin.id === params.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'User deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
     if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }
    if (error.message === 'Forbidden: Insufficient privileges') {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}