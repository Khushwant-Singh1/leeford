// app/api/debug/services-auth/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Handle query parameters (same as main API)
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    console.log('Debug API called with:', {
      page,
      limit,
      search,
      status,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    // Build where clause
    let where: any = {};
    
    // Handle status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    } else {
      // Default: only show active services
      where.isActive = true;
    }

    // Handle search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('Where clause:', where);

    const skip = (page - 1) * limit;
    
    // Get total count
    const totalServices = await prisma.service.count({ where });
    
    console.log('Total services found:', totalServices);
    
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
        }
      }
    });

    console.log('Services found:', services.length);

    const totalPages = Math.ceil(totalServices / limit);

    const response = {
      services,
      pagination: {
        page,
        limit,
        total: totalServices,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    console.log('Final response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Debug services-auth error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
