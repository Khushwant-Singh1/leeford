import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { lockPost, unlockPost } from '@/lib/blog/utils';

// POST /api/admin/blog/posts/[id]/lock - Lock post for editing
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
    const success = await lockPost(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Post is currently locked by another user' },
        { status: 423 }
      );
    }

    return NextResponse.json({ message: 'Post locked successfully' });
  } catch (error) {
    console.error('Failed to lock post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/posts/[id]/lock - Unlock post
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
    await unlockPost(id, session.user.id);

    return NextResponse.json({ message: 'Post unlocked successfully' });
  } catch (error) {
    console.error('Failed to unlock post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
