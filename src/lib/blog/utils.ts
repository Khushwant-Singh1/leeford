import { PrismaClient, BlogPost, BlogStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface BlogPostWithRelations extends BlogPost {
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  lastEditedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Check if slug is unique
export async function isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  const existingPost = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!existingPost) return true;
  if (excludeId && existingPost.id === excludeId) return true;
  
  return false;
}

// Generate unique slug if needed
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugUnique(slug, excludeId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// Calculate reading time (average 200 words per minute)
export function calculateReadingTime(content: any): number {
  if (!content || !content.content) return 1;
  
  const text = extractTextFromTiptapContent(content);
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  return Math.max(1, Math.ceil(wordCount / 200));
}

// Extract plain text from Tiptap JSON content
function extractTextFromTiptapContent(content: any): string {
  if (!content || !content.content) return '';
  
  let text = '';
  
  function traverse(node: any) {
    if (node.type === 'text') {
      text += node.text || '';
    } else if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }
  
  content.content.forEach(traverse);
  return text;
}

// Lock post for editing
export async function lockPost(postId: string, userId: string): Promise<boolean> {
  try {
    // Check if post is already locked by someone else
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { isLocked: true, lockedBy: true, lockedAt: true },
    });

    if (!post) return false;

    // If locked by someone else and lock is recent (within 30 minutes), deny lock
    if (post.isLocked && post.lockedBy !== userId && post.lockedAt) {
      const lockAge = Date.now() - post.lockedAt.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (lockAge < thirtyMinutes) {
        return false;
      }
    }

    // Acquire lock
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        isLocked: true,
        lockedBy: userId,
        lockedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to lock post:', error);
    return false;
  }
}

// Release post lock
export async function unlockPost(postId: string, userId: string): Promise<void> {
  try {
    await prisma.blogPost.updateMany({
      where: {
        id: postId,
        lockedBy: userId,
      },
      data: {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      },
    });
  } catch (error) {
    console.error('Failed to unlock post:', error);
  }
}

// Auto-save draft content
export async function autosaveDraft(
  postId: string,
  content: any,
  title?: string
): Promise<void> {
  try {
    const updateData: any = {
      autosaveDraft: content,
      autosavedAt: new Date(),
    };

    if (title) {
      updateData.title = title;
    }

    await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
    });
  } catch (error) {
    console.error('Failed to autosave draft:', error);
  }
}

// Publish post
export async function publishPost(postId: string, userId: string): Promise<boolean> {
  try {
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: BlogStatus.PUBLISHED,
        publishedAt: new Date(),
        lastEditedBy: { connect: { id: userId } },
        version: { increment: 1 },
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to publish post:', error);
    return false;
  }
}

// Unpublish post
export async function unpublishPost(postId: string, userId: string): Promise<boolean> {
  try {
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: BlogStatus.DRAFT,
        publishedAt: null,
        lastEditedBy: { connect: { id: userId } },
        version: { increment: 1 },
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to unpublish post:', error);
    return false;
  }
}

// Track blog analytics
export async function trackBlogEvent(
  postId: string,
  event: string,
  userAgent?: string,
  ipAddress?: string,
  referrer?: string
): Promise<void> {
  try {
    await prisma.blogAnalytics.create({
      data: {
        postId,
        event,
        userAgent,
        ipAddress,
        referrer,
      },
    });

    // Update view count if it's a view event
    if (event === 'view') {
      await prisma.blogPost.update({
        where: { id: postId },
        data: { views: { increment: 1 } },
      });
    }
  } catch (error) {
    console.error('Failed to track blog event:', error);
  }
}

// Get posts with filters and pagination
export async function getBlogPosts(options: {
  status?: BlogStatus[];
  authorId?: string;
  categoryId?: string;
  tagId?: string;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'views';
  orderDirection?: 'asc' | 'desc';
}) {
  const {
    status,
    authorId,
    categoryId,
    tagId,
    search,
    page = 1,
    limit = 10,
    orderBy = 'createdAt',
    orderDirection = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  const where: any = {};

  if (status && status.length > 0) {
    where.status = { in: status };
  }

  if (authorId) {
    where.authorId = authorId;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (tagId) {
    where.tags = {
      some: { id: tagId },
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
      orderBy: { [orderBy]: orderDirection },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
