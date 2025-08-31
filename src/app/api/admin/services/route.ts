import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildServiceTree, getNextPosition, generateSlug, getServiceDepth, generatePath, isSlugUnique } from '@/lib/services/utils';
import { auth } from '@/lib/auth';
import * as z from 'zod';

// Validation schema for creating services
const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  image: z.string().url().optional(),
});

// GET /api/admin/services - Fetch Services Tree
export async function GET(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle query parameters
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const maxDepth = parseInt(searchParams.get('maxDepth') || '0');

    // Build where clause
    const where = includeInactive ? {} : { isActive: true };

    // Fetch services
    const services = await prisma.service.findMany({
      where,
      orderBy: [{ parentId: 'asc' }, { position: 'asc' }],
    });

    // Build tree
    let tree = buildServiceTree(services);

    // Apply depth filter if specified
    if (maxDepth > 0) {
      const filterByDepth = (nodes: any[], currentDepth = 0): any[] => {
        return nodes.filter(node => {
          if (currentDepth >= maxDepth) {
            node.children = [];
            return true;
          }
          node.children = filterByDepth(node.children, currentDepth + 1);
          return true;
        });
      };
      tree = filterByDepth(tree);
    }

    return NextResponse.json(tree);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/services - Create Service
export async function POST(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await req.json();
    const validation = createServiceSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, parentId, image } = validation.data;

    // Check if parent exists if parentId provided
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

    // Generate slug
    const slug = generateSlug(name);
    const slugIsUnique = await isSlugUnique(slug);
    if (!slugIsUnique) {
      return NextResponse.json(
        { error: 'Service with this name already exists' },
        { status: 409 }
      );
    }

    // Calculate position and depth
    const position = await getNextPosition(parentId || null);
    const depth = parentId ? (await getServiceDepth(parentId)) + 1 : 0;
    const path = parentId ? await generatePath(parentId) : [];

    // Create service
    const service = await prisma.service.create({
      data: {
        name,
        description,
        slug,
        image,
        parentId,
        position,
        depth,
        path,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Failed to create service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
