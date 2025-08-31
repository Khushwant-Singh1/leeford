import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/blog/utils';
import * as z from 'zod';

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// GET /api/admin/blog/tags - Fetch all tags
export async function GET(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const,
      },
    } : {};

    const tags = await prisma.blogTag.findMany({
      where,
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { name: 'asc' },
      take: search ? 10 : undefined, // Limit for search results
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Failed to fetch blog tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog/tags - Create new tag
export async function POST(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await req.json();
    const validation = tagSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, color } = validation.data;

    // Generate unique slug
    const slug = generateSlug(name);
    
    // Check if slug already exists
    const existingTag = await prisma.blogTag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 409 }
      );
    }

    const tag = await prisma.blogTag.create({
      data: {
        name,
        slug,
        color,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Failed to create blog tag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
