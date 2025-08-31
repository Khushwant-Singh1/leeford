import { prisma } from '@/lib/db';

// Reorder services when positions change
export async function reorderServices(
  parentId: string | null,
  newOrder: string[]
): Promise<void> {
  await prisma.$transaction(
    newOrder.map((id, index) =>
      prisma.service.update({
        where: { id },
        data: { position: index },
      })
    )
  );
}

// Move service to new parent with position
export async function moveService(
  serviceId: string,
  newParentId: string | null,
  newPosition: number
): Promise<void> {
  // Get current service and siblings in new parent
  const [service, siblings] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.service.findMany({
      where: { parentId: newParentId },
      orderBy: { position: 'asc' },
    }),
  ]);

  if (!service) {
    throw new Error('Service not found');
  }

  // Remove service from current position
  const currentSiblings = await prisma.service.findMany({
    where: { parentId: service.parentId },
    orderBy: { position: 'asc' },
  });

  const currentSiblingsWithoutService = currentSiblings.filter(
    s => s.id !== serviceId
  );

  // Add service to new position
  const newSiblings = [
    ...siblings.slice(0, newPosition),
    service,
    ...siblings.slice(newPosition),
  ];

  // Update all positions
  await Promise.all([
    reorderServices(service.parentId, currentSiblingsWithoutService.map(s => s.id)),
    reorderServices(newParentId, newSiblings.map(s => s.id)),
    prisma.service.update({
      where: { id: serviceId },
      data: { parentId: newParentId },
    }),
  ]);
}

// Bulk update service positions
export async function bulkUpdatePositions(
  updates: Array<{ id: string; position: number }>
): Promise<void> {
  await prisma.$transaction(
    updates.map(({ id, position }) =>
      prisma.service.update({
        where: { id },
        data: { position },
      })
    )
  );
}

// Bulk update service active status
export async function bulkUpdateActiveStatus(
  serviceIds: string[],
  isActive: boolean
): Promise<void> {
  await prisma.service.updateMany({
    where: { id: { in: serviceIds } },
    data: { isActive },
  });
}

// Duplicate a service (with optional parent change)
export async function duplicateService(
  serviceId: string,
  newParentId?: string | null,
  namePrefix: string = 'Copy of '
): Promise<string> {
  const originalService = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!originalService) {
    throw new Error('Service not found');
  }

  // Generate unique slug for the copy
  let copySlug = `${originalService.slug}-copy`;
  let counter = 1;
  
  while (!(await isSlugUnique(copySlug))) {
    copySlug = `${originalService.slug}-copy-${counter}`;
    counter++;
  }

  const targetParentId = newParentId !== undefined ? newParentId : originalService.parentId;
  
  // Get next position in target parent
  const nextPosition = await getNextPosition(targetParentId);
  
  // Calculate depth and path for new service
  const depth = targetParentId ? (await getServiceDepth(targetParentId)) + 1 : 0;
  const path = targetParentId ? await generatePath(targetParentId) : [];

  const newService = await prisma.service.create({
    data: {
      name: `${namePrefix}${originalService.name}`,
      description: originalService.description,
      slug: copySlug,
      image: originalService.image,
      isActive: false, // New copies start as inactive for review
      position: nextPosition,
      depth,
      path,
      parentId: targetParentId,
    },
  });

  return newService.id;
}

// Helper functions imported from utils
import { getNextPosition, getServiceDepth, generatePath, isSlugUnique } from './utils';
