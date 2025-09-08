import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdminOrEditor, checkAdmin } from '@/lib/auth-helper';
import * as z from 'zod';
import { ContentStatus } from '@prisma/client';

// Zod schema for updating (all fields optional)
const updateTestimonialSchema = z.object({
  author: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  title: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(1).max(5).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
});

/**
 * PATCH /api/admin/testimonials/[id] - Updates a testimonial
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await checkAdminOrEditor();
    
    const body = await req.json();
    const validation = updateTestimonialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json(updatedTestimonial);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update testimonial' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/testimonials/[id] - Deletes a testimonial
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await checkAdmin(); 
    
    await prisma.testimonial.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Testimonial deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete testimonial' }, { status: 500 });
  }
}