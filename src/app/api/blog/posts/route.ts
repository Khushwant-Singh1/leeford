import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { trackBlogEvent } from '@/lib/blog/utils';

// GET /api/blog/posts - Fetch published blog posts for public consumption
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const categorySlug = searchParams.get('category');
    const tagSlug = searchParams.get('tag');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;

    // Build where clause - only published posts
    const where: any = {
      status: 'PUBLISHED',
    };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (tagSlug) {
      where.tags = {
        some: { slug: tagSlug },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    // Remove sensitive content field for list view
    const publicPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      readingTime: post.readingTime,
      views: post.views,
      author: post.author,
      category: post.category,
      tags: post.tags,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    }));

    return NextResponse.json({
      posts: publicPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
