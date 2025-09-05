import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdmin } from '@/lib/auth-helper';

/**
 * PATCH /api/admin/authors/[authorId] - Updates an author profile.
 */
export async function PATCH(req: Request, { params }: { params: { authorId: string } }) {
  try {
    await checkAdmin();
    const body = await req.json();
    // Add Zod validation here for production
    const { name, bio, profilePicture, socialLinks } = body;

    const updatedAuthor = await prisma.authorProfile.update({
      where: { id: params.authorId },
      data: { name, bio, profilePicture, socialLinks },
    });
    return NextResponse.json(updatedAuthor);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update author' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/authors/[authorId] - Deletes an author profile.
 */
export async function DELETE(req: Request, { params }: { params: { authorId: string } }) {
    try {
        await checkAdmin();
        await prisma.authorProfile.delete({
            where: { id: params.authorId },
        });
        return NextResponse.json({ message: 'Author deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete author' }, { status: 500 });
    }
}