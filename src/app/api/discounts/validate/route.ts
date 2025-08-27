import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await auth();
    const body = await request.json();
    const { code, productIds = [], categoryIds = [], userId, subtotal = 0, quantity = 1 } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    // Find the discount by code
    const discount = await prisma.discount.findUnique({
      where: { code },
      include: {
        products: {
          select: { productId: true }
        },
        categories: {
          select: { categoryId: true }
        }
      }
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 404 }
      );
    }

    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);

    // Check if discount is active and within validity period
    if (!discount.isActive || now < validFrom || now > validTo) {
      return NextResponse.json(
        { error: 'This discount code is not currently valid' },
        { status: 400 }
      );
    }

    // Check minimum purchase amount if set
    if (discount.minimumPurchase && subtotal < discount.minimumPurchase) {
      return NextResponse.json(
        { 
          error: `Minimum purchase amount of ₹${discount.minimumPurchase} required for this discount` 
        },
        { status: 400 }
      );
    }

    // Check minimum quantity for volume discounts
    if (discount.minQuantity && quantity < discount.minQuantity) {
      return NextResponse.json(
        { 
          error: `Minimum quantity of ${discount.minQuantity} items required for this discount` 
        },
        { status: 400 }
      );
    }

    // Check if discount is applicable to the products in cart
    if (discount.applicability === 'SPECIFIC_PRODUCTS') {
      const discountProductIds = discount.products.map(p => p.productId);
      const hasMatchingProduct = productIds.some((id: string) => 
        discountProductIds.includes(id)
      );

      if (!hasMatchingProduct) {
        return NextResponse.json(
          { error: 'This discount code is not applicable to any items in your cart' },
          { status: 400 }
        );
      }
    }

    // Check if discount is applicable to the categories in cart
    if (discount.applicability === 'SPECIFIC_CATEGORIES') {
      const discountCategoryIds = discount.categories.map(c => c.categoryId);
      const hasMatchingCategory = categoryIds.some((id: string) => 
        discountCategoryIds.includes(id)
      );

      if (!hasMatchingCategory) {
        return NextResponse.json(
          { error: 'This discount code is not applicable to any items in your cart' },
          { status: 400 }
        );
      }
    }

    // Check first purchase discount
    if (discount.applicability === 'FIRST_PURCHASE' && userId) {
      const orderCount = await prisma.order.count({
        where: { userId }
      });

      if (orderCount > 0) {
        return NextResponse.json(
          { error: 'This discount is only valid for first-time customers' },
          { status: 400 }
        );
      }
    }

    // Check usage limit
    if (discount.usageLimit) {
      const usageCount = await prisma.userDiscountUsage.aggregate({
        where: { discountId: discount.id },
        _sum: { usageCount: true }
      });

      const totalUsage = usageCount._sum.usageCount || 0;
      
      if (totalUsage >= discount.usageLimit) {
        return NextResponse.json(
          { error: 'This discount has reached its maximum usage limit' },
          { status: 400 }
        );
      }
    }

    // Check per-user usage limit if user is logged in
    if (userId) {
      const userUsage = await prisma.userDiscountUsage.findUnique({
        where: {
          userId_discountId: {
            userId,
            discountId: discount.id
          }
        }
      });

      if (userUsage && discount.perUserLimit && userUsage.usageCount >= discount.perUserLimit) {
        return NextResponse.json(
          { error: 'You have already used this discount the maximum number of times' },
          { status: 400 }
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    
    if (discount.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * discount.discountValue) / 100;
      
      // Apply maximum discount cap if set
      if (discount.maximumDiscount && discountAmount > discount.maximumDiscount) {
        discountAmount = discount.maximumDiscount;
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(discount.discountValue, subtotal);
    }

    // Prepare response
    const response = {
      id: discount.id,
      code: discount.code,
      name: discount.name,
      description: discount.description,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      amount: discountAmount
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}
