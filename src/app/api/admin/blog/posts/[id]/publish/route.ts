import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { publishPost, unpublishPost } from '@/lib/blog/utils';

// POST /api/admin/blog/posts/[id]/publish - Publish post
export async function POST(
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
    const success = await publishPost(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to publish post' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Post published successfully' });
  } catch (error) {
    console.error('Failed to publish post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/posts/[id]/publish - Unpublish post
export async function DELETE(
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
    const success = await unpublishPost(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unpublish post' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Post unpublished successfully' });
  } catch (error) {
    console.error('Failed to unpublish post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
