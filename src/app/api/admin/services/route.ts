import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildServiceTree, getNextPosition, generateSlug, getServiceDepth, generatePath, isSlugUnique } from '@/lib/services/utils';
import { safeParseJSON, checkAdminAuth, validateData, errorResponse, successResponse } from '@/lib/api-utils';
import { auth } from '@/lib/auth';
import * as z from 'zod';

// Validation schema for creating services
const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
  components: z.array(z.object({
    type: z.enum(['HEADING', 'TEXT_BLOCK', 'IMAGE', 'IMAGE_CAROUSEL', 'VIDEO_EMBED', 'REVIEW_CARD', 'ARTICLE_GRID', 'QUOTE_BLOCK', 'CTA_BUTTON', 'SPACER', 'DIVIDER']),
    content: z.record(z.string(), z.any()),
    styleVariant: z.string().optional(),
    order: z.number(),
    carouselImages: z.array(z.object({
      imageUrl: z.string(),
      altText: z.string().optional(),
      caption: z.string().optional(),
      order: z.number(),
    })).optional(),
  })).optional().default([]),
}).transform((data) => ({
  ...data,
  parentId: data.parentId === 'none' || data.parentId === '' ? null : data.parentId,
}));

type CreateServiceData = z.infer<typeof createServiceSchema>;

// GET /api/admin/services - Fetch Services Tree or Paginated List
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const parentOnly = searchParams.get('parentOnly') === 'true';

    // Build where clause
    const where: any = {};
    
    // Handle status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    // When status is 'all' or not provided, show all services (both active and inactive)

    // Handle search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle parent-only filter
    if (parentOnly) {
      where.parentId = null;
    }

    // If pagination parameters are provided, return paginated list
    if (page && limit) {
      const skip = (page - 1) * limit;
      
      // Get total count
      const totalServices = await prisma.service.count({ where });
      
      // Fetch paginated services
      const services = await prisma.service.findMany({
        where,
        orderBy: [{ parentId: 'asc' }, { position: 'asc' }],
        skip,
        take: limit,
        include: {
          parent: {
            select: { name: true }
          },
          children: {
            select: { id: true, name: true }
          },
          _count: {
            select: { children: true }
          }
        }
      });

      const totalPages = Math.ceil(totalServices / limit);

      return NextResponse.json({
        services,
        pagination: {
          page,
          limit,
          total: totalServices,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    }

    // Otherwise, return tree structure (legacy behavior)
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
    return errorResponse('Internal server error');
  }
}

// POST /api/admin/services - Create Service
export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const { user, error: authError } = await checkAdminAuth();
    if (authError) return authError;

    // Parse and validate request body
    const { data: requestData, error: parseError } = await safeParseJSON(req);
    if (parseError) return parseError;

    const { validated, error: validationError } = validateData<CreateServiceData>(createServiceSchema, requestData);
    if (validationError) return validationError;

    if (!validated) {
      return errorResponse('Validation failed');
    }

    const { name, description, parentId, image, isActive, components } = validated;

    // Check if parent exists if parentId provided
    if (parentId) {
      const parent = await prisma.service.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return errorResponse('Parent service not found', 404);
      }
    }

    // Generate slug
    const slug = generateSlug(name);
    const slugIsUnique = await isSlugUnique(slug);
    if (!slugIsUnique) {
      return errorResponse('Service with this name already exists', 409);
    }

    // Calculate position and depth
    const position = await getNextPosition(parentId || null);
    const depth = parentId ? (await getServiceDepth(parentId)) + 1 : 0;
    const path = parentId ? await generatePath(parentId) : [];

    // Create service with components in a transaction
    const service = await prisma.$transaction(async (tx) => {
      // Create the service
      const newService = await tx.service.create({
        data: {
          name,
          description,
          slug,
          image,
          parentId,
          position,
          depth,
          path,
          isActive,
        },
      });

      // Create page components if provided
      if (components && components.length > 0) {
        for (const component of components) {
          const { carouselImages, ...componentData } = component;
          
          const createdComponent = await tx.pageComponent.create({
            data: {
              ...componentData,
              serviceId: newService.id,
            },
          });

          // Create carousel images if this is an image carousel
          if (component.type === 'IMAGE_CAROUSEL' && carouselImages) {
            await tx.carouselImage.createMany({
              data: carouselImages.map(img => ({
                ...img,
                pageComponentId: createdComponent.id,
              })),
            });
          }
        }
      }

      return newService;
    });

    return successResponse(service, 201);
  } catch (error) {
    console.error('Failed to create service:', error);
    return errorResponse('Internal server error');
  }
}
