// app/api/debug/services/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get total count
    const totalServices = await prisma.service.count();
    
    // Get first 5 services
    const services = await prisma.service.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        isActive: true,
        parentId: true,
        createdAt: true
      }
    });

    // Get active services count
    const activeServices = await prisma.service.count({
      where: { isActive: true }
    });

    // Get inactive services count  
    const inactiveServices = await prisma.service.count({
      where: { isActive: false }
    });

    return NextResponse.json({
      debug: true,
      totalServices,
      activeServices,
      inactiveServices,
      sampleServices: services,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug services error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
