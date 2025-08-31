import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateSlug } from '@/lib/blog/utils';
import * as z from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// GET /api/admin/blog/categories - Fetch all categories
export async function GET(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const categories = await prisma.blogCategory.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch blog categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog/categories - Create new category
export async function POST(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Only admins can create categories' }, { status: 403 });
    }

    const data = await req.json();
    const validation = categorySchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, color } = validation.data;

    // Generate unique slug
    const slug = generateSlug(name);
    
    // Check if slug already exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description,
        color,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Failed to create blog category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
