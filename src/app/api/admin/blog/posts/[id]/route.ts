import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { 
  lockPost, 
  unlockPost, 
  autosaveDraft, 
  publishPost, 
  unpublishPost, 
  generateUniqueSlug, 
  calculateReadingTime 
} from '@/lib/blog/utils';
import { BlogStatus } from '@prisma/client';
import * as z from 'zod';

// Validation schema for updating blog posts
const updateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.any().optional(), // Tiptap JSON content
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

// GET /api/admin/blog/posts/[id] - Get single blog post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
        lastEditedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    return NextResponse.json(blogPost);
  } catch (error) {
    console.error('Failed to fetch blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/blog/posts/[id] - Update blog post
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();
    const validation = updateBlogPostSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { 
        id: true, 
        title: true, 
        slug: true, 
        isLocked: true, 
        lockedBy: true,
        lockedAt: true,
        authorId: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Check if post is locked by another user
    if (existingPost.isLocked && existingPost.lockedBy !== session.user.id) {
      const lockAge = existingPost.lockedAt ? Date.now() - existingPost.lockedAt.getTime() : 0;
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (lockAge < thirtyMinutes) {
        return NextResponse.json(
          { error: 'Post is currently being edited by another user' },
          { status: 423 } // Locked
        );
      }
    }

    const { title, content, excerpt, featuredImage, categoryId, tagIds, status, seoTitle, seoDescription } = validation.data;

    // Build update data
    const updateData: any = {
      lastEditedById: session.user.id,
      version: { increment: 1 },
    };

    if (title) {
      updateData.title = title;
      // Generate new slug if title changed
      if (title !== existingPost.title) {
        updateData.slug = await generateUniqueSlug(title, id);
      }
    }

    if (content) {
      updateData.content = content;
      updateData.readingTime = calculateReadingTime(content);
    }

    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;

    // Handle status changes
    if (status) {
      updateData.status = status;
      if (status === 'PUBLISHED') {
        updateData.publishedAt = new Date();
      } else if (status === 'DRAFT' || status === 'ARCHIVED') {
        updateData.publishedAt = null;
      }
    }

    // Handle tag updates
    const connectDisconnectData: any = {};
    if (tagIds !== undefined) {
      // Get current tags
      const currentPost = await prisma.blogPost.findUnique({
        where: { id },
        include: { tags: { select: { id: true } } },
      });

      const currentTagIds = currentPost?.tags.map(tag => tag.id) || [];
      const newTagIds = tagIds || [];

      const tagsToConnect = newTagIds.filter(tagId => !currentTagIds.includes(tagId));
      const tagsToDisconnect = currentTagIds.filter(tagId => !newTagIds.includes(tagId));

      if (tagsToConnect.length > 0) {
        connectDisconnectData.connect = tagsToConnect.map(id => ({ id }));
      }
      if (tagsToDisconnect.length > 0) {
        connectDisconnectData.disconnect = tagsToDisconnect.map(id => ({ id }));
      }
    }

    // Update the blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...updateData,
        ...(Object.keys(connectDisconnectData).length > 0 && {
          tags: connectDisconnectData,
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
        lastEditedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Failed to update blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/posts/[id] - Delete blog post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Only admins can delete posts' }, { status: 403 });
    }

    const { id } = await params;

    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
