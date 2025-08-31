import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { autosaveDraft } from '@/lib/blog/utils';
import * as z from 'zod';

const autosaveSchema = z.object({
  content: z.any(), // Tiptap JSON content
  title: z.string().optional(),
});

// POST /api/admin/blog/posts/[id]/autosave - Autosave draft content
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
    const data = await req.json();
    const validation = autosaveSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { content, title } = validation.data;

    await autosaveDraft(id, content, title);

    return NextResponse.json({ 
      message: 'Draft autosaved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to autosave draft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
