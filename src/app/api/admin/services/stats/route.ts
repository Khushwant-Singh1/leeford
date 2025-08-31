import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/services/stats - Get service statistics
export async function GET(req: NextRequest) {
  try {
    // Authentication and authorization
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get basic counts
    const [
      totalServices,
      activeServices,
      inactiveServices,
      rootServices,
      orphanedServices,
      maxDepth
    ] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.service.count({ where: { isActive: false } }),
      prisma.service.count({ where: { parentId: null } }),
      // Orphaned services: services with parentId that doesn't exist
      prisma.service.count({
        where: {
          parentId: { not: null },
          parent: null
        }
      }),
      // Get the maximum depth
      prisma.service.aggregate({
        _max: { depth: true }
      }).then(result => result._max.depth || 0)
    ]);

    // Get services by depth
    const servicesByDepth = await prisma.service.groupBy({
      by: ['depth'],
      _count: { id: true },
      orderBy: { depth: 'asc' }
    });

    // Get recently created services
    const recentServices = await prisma.service.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        parent: {
          select: {
            name: true
          }
        }
      }
    });

    // Get recently updated services
    const allRecentlyUpdated = await prisma.service.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        updatedAt: true,
        createdAt: true,
        parent: {
          select: {
            name: true
          }
        }
      }
    });

    // Filter out services where updatedAt equals createdAt (newly created)
    const recentlyUpdated = allRecentlyUpdated
      .filter(service => service.updatedAt.getTime() !== service.createdAt.getTime())
      .slice(0, 5);

    // Calculate tree health metrics
    const treeHealth = {
      orphanedServices,
      maxDepth,
      avgChildrenPerParent: 0,
      deepestServices: [] as any[]
    };

    // Get average children per parent
    const parentsWithChildCount = await prisma.service.findMany({
      where: {
        children: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { children: true }
        }
      }
    });

    if (parentsWithChildCount.length > 0) {
      const totalChildren = parentsWithChildCount.reduce((sum, parent) => sum + parent._count.children, 0);
      treeHealth.avgChildrenPerParent = totalChildren / parentsWithChildCount.length;
    }

    // Get deepest services
    if (maxDepth > 0) {
      treeHealth.deepestServices = await prisma.service.findMany({
        where: { depth: maxDepth },
        select: {
          id: true,
          name: true,
          slug: true,
          depth: true,
          path: true
        },
        take: 10
      });
    }

    return NextResponse.json({
      overview: {
        totalServices,
        activeServices,
        inactiveServices,
        rootServices,
        healthScore: orphanedServices === 0 ? 100 : Math.max(0, 100 - (orphanedServices / totalServices) * 100)
      },
      distribution: {
        byDepth: servicesByDepth.map(item => ({
          depth: item.depth,
          count: item._count.id
        })),
        maxDepth
      },
      recent: {
        created: recentServices,
        updated: recentlyUpdated
      },
      treeHealth
    });
  } catch (error) {
    console.error('Failed to fetch service statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
