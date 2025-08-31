import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { trackBlogEvent } from '@/lib/blog/utils';

// GET /api/blog/posts/[slug] - Get single published blog post by slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const blogPost = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
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
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Track view event
    const userAgent = req.headers.get('user-agent') || undefined;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : req.headers.get('x-real-ip') || undefined;
    const referrer = req.headers.get('referer') || undefined;

    // Don't await this to avoid slowing down the response
    trackBlogEvent(blogPost.id, 'view', userAgent, ipAddress, referrer).catch(console.error);

    // Get related posts from same category
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: blogPost.categoryId,
        id: { not: blogPost.id },
      },
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
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    // Remove sensitive fields and prepare response
    const publicPost = {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      content: blogPost.content,
      excerpt: blogPost.excerpt,
      featuredImage: blogPost.featuredImage,
      publishedAt: blogPost.publishedAt,
      readingTime: blogPost.readingTime,
      views: blogPost.views + 1, // Optimistically increment
      author: blogPost.author,
      category: blogPost.category,
      tags: blogPost.tags,
      seoTitle: blogPost.seoTitle,
      seoDescription: blogPost.seoDescription,
      relatedPosts: relatedPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        publishedAt: post.publishedAt,
        readingTime: post.readingTime,
        author: post.author,
        category: post.category,
      })),
    };

    return NextResponse.json(publicPost);
  } catch (error) {
    console.error('Failed to fetch blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
