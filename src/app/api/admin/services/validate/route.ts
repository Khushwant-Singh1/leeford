import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateNoCircularReference, isSlugUnique } from '@/lib/services/utils';
import { prisma } from '@/lib/db';
import * as z from 'zod';

const validateSlugSchema = z.object({
  slug: z.string().min(1),
  excludeId: z.string().uuid().optional(),
});

const validateParentSchema = z.object({
  serviceId: z.string().uuid(),
  potentialParentId: z.string().uuid(),
});

const validateNameSchema = z.object({
  name: z.string().min(1),
  excludeId: z.string().uuid().optional(),
});

// POST /api/admin/services/validate - Validation endpoint
export async function POST(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'slug': {
        const validation = validateSlugSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { slug, excludeId } = validation.data;
        const isUnique = await isSlugUnique(slug, excludeId);
        
        return NextResponse.json({ 
          isValid: isUnique,
          message: isUnique ? 'Slug is available' : 'Slug already exists'
        });
      }

      case 'name': {
        const validation = validateNameSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { name, excludeId } = validation.data;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const isUnique = await isSlugUnique(slug, excludeId);
        
        return NextResponse.json({ 
          isValid: isUnique,
          generatedSlug: slug,
          message: isUnique ? 'Name is available' : 'Service with this name already exists'
        });
      }

      case 'parent': {
        const validation = validateParentSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { serviceId, potentialParentId } = validation.data;
        
        // Check if parent exists
        const parent = await prisma.service.findUnique({
          where: { id: potentialParentId },
        });

        if (!parent) {
          return NextResponse.json({
            isValid: false,
            message: 'Parent service not found'
          });
        }

        const isValid = await validateNoCircularReference(serviceId, potentialParentId);
        
        return NextResponse.json({ 
          isValid,
          message: isValid ? 'Parent assignment is valid' : 'Circular reference detected'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid validation action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Validation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
