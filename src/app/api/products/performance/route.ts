// src/app/api/products/performance/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET handler for fetching top-selling product performance data.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Aggregate sales data from OrderItems
    const productSales = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc", // Order by most units sold
        },
      },
      take: 10, // Get the top 10 selling products
    });

    // Get the product details for the top sellers
    const productIds = productSales.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        title: true,
      },
    });

    // Combine the sales data with product details
    const topSellingProducts = productSales.map((sale) => {
      const product = products.find((p) => p.id === sale.productId);
      return {
        name: product?.title || "Unknown Product",
        sales: sale._sum.quantity || 0,
        revenue: sale._sum.total || 0,
      };
    });

    return NextResponse.json(topSellingProducts);
  } catch (error) {
    console.error("Failed to fetch product performance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
