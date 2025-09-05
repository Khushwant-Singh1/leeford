import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getBlogPosts, generateUniqueSlug, calculateReadingTime } from '@/lib/blog/utils';
import { BlogStatus } from '@prisma/client';
import * as z from 'zod';

// Validation schema for creating blog posts
const createBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.any(), // Tiptap JSON content
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'PUBLISHED']).default('DRAFT'),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

// GET /api/admin/blog/posts - Fetch blog posts with filters
export async function GET(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle query parameters
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const status = statusParam && statusParam !== 'all' ? statusParam.split(',') as BlogStatus[] : undefined;
    const authorId = searchParams.get('authorId') || undefined;
    const categoryIdParam = searchParams.get('categoryId');
    const categoryId = categoryIdParam && categoryIdParam !== 'all' ? categoryIdParam : undefined;
    const tagId = searchParams.get('tagId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const orderBy = searchParams.get('orderBy') as 'createdAt' | 'updatedAt' | 'publishedAt' | 'views' || 'createdAt';
    const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'desc';

    const result = await getBlogPosts({
      status,
      authorId,
      categoryId,
      tagId,
      search,
      page,
      limit,
      orderBy,
      orderDirection,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog/posts - Create new blog post
export async function POST(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await req.json();
    const validation = createBlogPostSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, content, excerpt, featuredImage, categoryId, tagIds, status, seoTitle, seoDescription } = validation.data;

    // Generate unique slug
    const slug = await generateUniqueSlug(title);

    // Calculate reading time
    const readingTime = calculateReadingTime(content);

    // Create the blog post
    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status: status as BlogStatus,
        readingTime,
        seoTitle,
        seoDescription,
        authorId: session.user.id,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        ...(categoryId && { categoryId }),
        ...(tagIds && tagIds.length > 0 && {
          tags: {
            connect: tagIds.map(id => ({ id })),
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(blogPost, { status: 201 });
  } catch (error) {
    console.error('Failed to create blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
