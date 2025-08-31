import { PrismaClient, Service } from '@prisma/client';

const prisma = new PrismaClient();

export interface ServiceTree extends Service {
  children: ServiceTree[];
}

// Efficient tree building with O(n) complexity
export function buildServiceTree(services: Service[]): ServiceTree[] {
  const serviceMap = new Map<string, ServiceTree>();
  const roots: ServiceTree[] = [];

  // Create a map of all services
  services.forEach(service => {
    serviceMap.set(service.id, { ...service, children: [] });
  });

  // Build the tree structure
  services.forEach(service => {
    const node = serviceMap.get(service.id)!;
    if (service.parentId) {
      const parent = serviceMap.get(service.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Handle orphaned nodes (parent not found)
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort tree recursively by position
  const sortTree = (nodes: ServiceTree[]) => {
    nodes.sort((a, b) => a.position - b.position);
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortTree(node.children);
      }
    });
  };

  sortTree(roots);
  return roots;
}

// Get all descendant IDs for cascade operations
export async function getDescendantIds(parentId: string): Promise<string[]> {
  const children = await prisma.service.findMany({
    where: { parentId },
    select: { id: true },
  });

  let descendantIds: string[] = [];
  for (const child of children) {
    descendantIds.push(child.id);
    const grandchildren = await getDescendantIds(child.id);
    descendantIds = descendantIds.concat(grandchildren);
  }

  return descendantIds;
}

// Validate no circular reference
export async function validateNoCircularReference(
  serviceId: string, 
  potentialParentId: string
): Promise<boolean> {
  if (serviceId === potentialParentId) {
    return false;
  }

  let currentParentId = potentialParentId;
  while (currentParentId) {
    const parent = await prisma.service.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    });

    if (parent?.parentId === serviceId) {
      return false;
    }
    currentParentId = parent?.parentId || '';
  }

  return true;
}

// Calculate next available position
export async function getNextPosition(parentId: string | null): Promise<number> {
  const lastService = await prisma.service.findFirst({
    where: { parentId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  return lastService ? lastService.position + 1 : 0;
}

// Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Calculate depth of a service
export async function getServiceDepth(serviceId: string): Promise<number> {
  let depth = 0;
  let currentId = serviceId;
  
  while (currentId) {
    const service = await prisma.service.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    
    if (service?.parentId) {
      depth++;
      currentId = service.parentId;
    } else {
      break;
    }
  }
  
  return depth;
}

// Generate path array for a service
export async function generatePath(serviceId: string): Promise<string[]> {
  const path: string[] = [];
  let currentId = serviceId;
  
  while (currentId) {
    const service = await prisma.service.findUnique({
      where: { id: currentId },
      select: { id: true, parentId: true },
    });
    
    if (service) {
      path.unshift(service.id);
      currentId = service.parentId || '';
    } else {
      break;
    }
  }
  
  return path;
}

// Check if slug already exists (for validation)
export async function isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  const existingService = await prisma.service.findUnique({
    where: { slug },
  });

  if (!existingService) return true;
  if (excludeId && existingService.id === excludeId) return true;
  
  return false;
}

// Get service with full hierarchy information
export async function getServiceWithHierarchy(serviceId: string) {
  return await prisma.service.findUnique({
    where: { id: serviceId },
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
}
