import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdminOrEditor } from '@/lib/auth-helper';
import * as z from 'zod';
import { ContentStatus } from '@prisma/client';

// Zod schema updated to match your Testimonial model
const createTestimonialSchema = z.object({
  author: z.string().min(1, 'Author name is required.'),
  content: z.string().min(1, 'Content is required.'),
  title: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(1).max(5).optional(),
  status: z.nativeEnum(ContentStatus).default('DRAFT'),
});

/**
 * GET /api/admin/testimonials - Fetches all testimonials
 */
export async function GET() {
  try {
    await checkAdminOrEditor();
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(testimonials);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch testimonials' }, { status: 500 });
  }
}

/**
 * POST /api/admin/testimonials - Creates a new testimonial
 */
export async function POST(req: Request) {
  try {
    await checkAdminOrEditor();
    
    const body = await req.json();
    const validation = createTestimonialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const newTestimonial = await prisma.testimonial.create({
      data: validation.data,
    });

    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create testimonial' }, { status: 500 });
  }
}