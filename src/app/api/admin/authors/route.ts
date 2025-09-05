import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdmin } from '@/lib/auth-helper';

/**
 * GET /api/admin/authors - Fetches all author profiles.
 */
export async function GET() {
  try {
    await checkAdmin();
    const authors = await prisma.authorProfile.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(authors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
  }
}

/**
 * POST /api/admin/authors - Creates a new author profile.
 */
export async function POST(req: Request) {
  try {
    await checkAdmin();
    const body = await req.json();
    // Add Zod validation here for production
    const { name, bio, profilePicture, socialLinks } = body;
    
    const newAuthor = await prisma.authorProfile.create({
      data: { name, bio, profilePicture, socialLinks },
    });
    return NextResponse.json(newAuthor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create author' }, { status: 500 });
  }
}