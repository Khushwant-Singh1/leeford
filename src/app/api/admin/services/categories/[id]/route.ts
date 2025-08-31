// app/api/admin/services/categories/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be less than 100 characters').optional(),
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

// PATCH /api/admin/services/categories/[id] - Update service category
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    // Check if the service exists and is a top-level service (category)
    const existingCategory = await prisma.service.findFirst({
      where: {
        id: categoryId,
        parentId: null // Must be a top-level service
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Service category not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = categoryUpdateSchema.parse(body);

    // Prepare update data
    const updateData: any = {};

    if (validatedData.name) {
      const slug = generateSlug(validatedData.name);
      
      // Check if slug already exists (excluding current category)
      const existingService = await prisma.service.findFirst({
        where: { 
          slug,
          id: { not: categoryId }
        }
      });

      if (existingService) {
        return NextResponse.json(
          { error: 'A service with this name already exists' },
          { status: 400 }
        );
      }

      updateData.name = validatedData.name;
      updateData.slug = slug;
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description || null;
    }

    // Update the category
    const updatedCategory = await prisma.service.update({
      where: { id: categoryId },
      data: updateData,
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
      ...updatedCategory,
      _count: {
        services: updatedCategory._count.children
      }
    };

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to update service category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/services/categories/[id] - Delete service category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    // Check if the service exists and is a top-level service (category)
    const existingCategory = await prisma.service.findFirst({
      where: {
        id: categoryId,
        parentId: null // Must be a top-level service
      },
      include: {
        _count: {
          select: {
            children: true
          }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Service category not found' },
        { status: 404 }
      );
    }

    // Check if category has sub-services
    if (existingCategory._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that has sub-services. Please move or delete sub-services first.' },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.service.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Failed to delete service category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/services/categories/[id] - Get single service category
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    // Fetch the service category
    const category = await prisma.service.findFirst({
      where: {
        id: categoryId,
        parentId: null // Must be a top-level service
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

    if (!category) {
      return NextResponse.json(
        { error: 'Service category not found' },
        { status: 404 }
      );
    }

    // Transform to match expected format
    const transformedCategory = {
      ...category,
      _count: {
        services: category._count.children
      }
    };

    return NextResponse.json(transformedCategory);
  } catch (error) {
    console.error('Failed to fetch service category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
