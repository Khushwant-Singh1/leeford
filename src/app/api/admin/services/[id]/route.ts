import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { validateNoCircularReference, getDescendantIds, getServiceWithHierarchy, isSlugUnique } from '@/lib/services/utils';
import * as z from 'zod';

// Validation schema for updating services
const updateServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/services/[id] - Get Single Service
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

    const { id } = await params;

    const service = await getServiceWithHierarchy(id);

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Failed to fetch service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/services/[id] - Update Service
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

    const { id } = await params;
    const data = await req.json();
    const validation = updateServiceSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, image, parentId, position, isActive } = validation.data;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check slug uniqueness if name is being updated
    if (name && name !== existingService.name) {
      const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slugIsUnique = await isSlugUnique(newSlug, id);
      if (!slugIsUnique) {
        return NextResponse.json(
          { error: 'Service with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Validate no circular reference if changing parent
    if (parentId && parentId !== existingService.parentId) {
      const isValid = await validateNoCircularReference(id, parentId);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Circular reference detected' },
          { status: 400 }
        );
      }
    }

    // Check if new parent exists
    if (parentId) {
      const parent = await prisma.service.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent service not found' },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (position !== undefined) updateData.position = position;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            position: true,
            isActive: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Failed to update service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/services/[id] - Delete Service
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

    const { id } = await params;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Use transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Get all descendant IDs
      const descendantIds = await getDescendantIds(id);
      const allIds = [id, ...descendantIds];

      // Soft delete all services
      await tx.service.updateMany({
        where: { id: { in: allIds } },
        data: { isActive: false },
      });

      return { deletedCount: allIds.length };
    });

    return NextResponse.json({
      message: `Successfully deactivated ${result.deletedCount} services`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Failed to delete service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
