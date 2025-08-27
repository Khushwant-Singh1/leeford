// src/app/api/products/overview/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PaymentStatus } from "@prisma/client";

/**
 * GET handler for fetching dashboard overview metrics.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Perform database queries in parallel for efficiency
    const [totalProducts, paidOrders, usersCount] = await prisma.$transaction([
      prisma.product.count(),
      prisma.order.findMany({
        where: { paymentStatus: PaymentStatus.PAID },
        select: { total: true },
      }),
      prisma.user.count({ where: { role: "USER" } }),
    ]);

    // Calculate total revenue from paid orders
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // Note: Growth calculation requires historical data.
    // For now, we'll return a static value as in the mock API.
    const growth = "+12.5%";

    return NextResponse.json({
      totalProducts,
      revenue: totalRevenue,
      growth,
      usersCount,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard overview:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
