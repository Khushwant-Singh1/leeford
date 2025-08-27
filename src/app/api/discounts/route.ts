// src/app/api/discounts/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth"; // Use the correct auth import
import { Discount, DiscountType, DiscountApplicability } from "@prisma/client";

// Note: You would typically define these Zod schemas in a shared validation file
import { z } from "zod";

const discountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional().nullable(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().min(0.01),
  applicability: z.nativeEnum(DiscountApplicability),
  minimumPurchase: z.coerce.number().min(0).optional().nullable(),
  maximumDiscount: z.coerce.number().min(0).optional().nullable(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    // FIX: Access role via session.user.role
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const discounts = await prisma.discount.findMany({
      include: {
        products: { include: { product: { select: { id: true, title: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format the response to be easily consumable by the frontend
    const formattedDiscounts = discounts.map(d => ({
      ...d,
      products: d.products.map(p => ({ productId: p.product.id, name: p.product.title })),
      categories: d.categories.map(c => ({ categoryId: c.category.id, name: c.category.name })),
    }));

    return NextResponse.json(formattedDiscounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth(); // FIX: Use auth() instead of getCurrentUser()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = discountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { productIds, categoryIds, ...discountData } = validation.data;

    const existingDiscount = await prisma.discount.findUnique({ where: { code: discountData.code } });
    if (existingDiscount) {
      return NextResponse.json({ error: 'Discount code already exists' }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
            ...discountData,
            validFrom: new Date(discountData.validFrom),
            validTo: new Date(discountData.validTo),
        },
      });

      if (productIds && productIds.length > 0) {
        await tx.productDiscount.createMany({
          data: productIds.map(productId => ({ productId, discountId: discount.id })),
        });
      }

      if (categoryIds && categoryIds.length > 0) {
        await tx.categoryDiscount.createMany({
          data: categoryIds.map(categoryId => ({ categoryId, discountId: discount.id })),
        });
      }

      return discount;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
