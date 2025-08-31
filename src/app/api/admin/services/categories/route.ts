// app/api/admin/services/categories/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
});

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// GET /api/admin/services/categories - Fetch top-level services as "categories"
export async function GET(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch top-level services (no parent) as "categories"
    const serviceCategories = await prisma.service.findMany({
      where: {
        parentId: null, // Top-level services only
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            children: true
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });

    // Transform to match expected category format
    const categories = serviceCategories.map(service => ({
      id: service.id,
      name: service.name,
      slug: service.slug,
      description: service.description,
      isActive: service.isActive,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      _count: {
        services: service._count.children // Rename children to services for category context
      }
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch service categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/services/categories - Create new top-level service category
export async function POST(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    // Generate slug
    const slug = generateSlug(validatedData.name);

    // Check if slug already exists
    const existingService = await prisma.service.findUnique({
      where: { slug }
    });

    if (existingService) {
      return NextResponse.json(
        { error: 'A service with this name already exists' },
        { status: 400 }
      );
    }

    // Get the highest position for top-level services
    const lastService = await prisma.service.findFirst({
      where: { parentId: null },
      orderBy: { position: 'desc' }
    });

    const position = (lastService?.position || 0) + 1;

    // Create new top-level service as category
    const newCategory = await prisma.service.create({
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description || null,
        parentId: null, // Top-level service
        position,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            children: true
          }
        }
      }
    });

    // Transform to match expected format
    const category = {
      ...newCategory,
      _count: {
        services: newCategory._count.children
      }
    };

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to create service category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
