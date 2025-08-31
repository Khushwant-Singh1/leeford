import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { reorderServices, moveService, bulkUpdatePositions, bulkUpdateActiveStatus, duplicateService } from '@/lib/services/bulk-ops';
import * as z from 'zod';

// Validation schemas
const reorderSchema = z.object({
  parentId: z.string().uuid().nullable(),
  newOrder: z.array(z.string().uuid()),
});

const moveServiceSchema = z.object({
  serviceId: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
  newPosition: z.number().int(),
});

const bulkPositionSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int(),
  })),
});

const bulkActiveSchema = z.object({
  serviceIds: z.array(z.string().uuid()),
  isActive: z.boolean(),
});

const duplicateSchema = z.object({
  serviceId: z.string().uuid(),
  newParentId: z.string().uuid().nullable().optional(),
  namePrefix: z.string().optional().default('Copy of '),
});

// POST /api/admin/services/bulk - Handle bulk operations
export async function POST(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { operation } = body;

    switch (operation) {
      case 'reorder': {
        const validation = reorderSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { parentId, newOrder } = validation.data;
        await reorderServices(parentId, newOrder);
        
        return NextResponse.json({ 
          message: 'Services reordered successfully',
          affected: newOrder.length 
        });
      }

      case 'move': {
        const validation = moveServiceSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { serviceId, newParentId, newPosition } = validation.data;
        await moveService(serviceId, newParentId, newPosition);
        
        return NextResponse.json({ 
          message: 'Service moved successfully' 
        });
      }

      case 'updatePositions': {
        const validation = bulkPositionSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { updates } = validation.data;
        await bulkUpdatePositions(updates);
        
        return NextResponse.json({ 
          message: 'Positions updated successfully',
          affected: updates.length 
        });
      }

      case 'updateActiveStatus': {
        const validation = bulkActiveSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { serviceIds, isActive } = validation.data;
        await bulkUpdateActiveStatus(serviceIds, isActive);
        
        return NextResponse.json({ 
          message: `Services ${isActive ? 'activated' : 'deactivated'} successfully`,
          affected: serviceIds.length 
        });
      }

      case 'duplicate': {
        const validation = duplicateSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: validation.error.flatten().fieldErrors },
            { status: 400 }
          );
        }

        const { serviceId, newParentId, namePrefix } = validation.data;
        const newServiceId = await duplicateService(serviceId, newParentId, namePrefix);
        
        return NextResponse.json({ 
          message: 'Service duplicated successfully',
          newServiceId 
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Bulk operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
