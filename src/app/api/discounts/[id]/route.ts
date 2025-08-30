import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DiscountType, DiscountApplicability } from "@prisma/client";

type DiscountUpdateData = {
  name?: string;
  code?: string;
  description?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  applicability?: DiscountApplicability;
  minimumPurchase?: number | null;
  maximumDiscount?: number | null;
  validFrom?: string | Date;
  validTo?: string | Date;
  isActive?: boolean;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  minQuantity?: number | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const discount = await prisma.discount.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, title: true }
            }
          }
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    const formattedDiscount = {
      ...discount,
      validFrom: discount.validFrom.toISOString(),
      validTo: discount.validTo.toISOString(),
      products: discount.products.map(p => ({
        id: p.product.id,
        name: p.product.title
      })),
      categories: discount.categories.map(c => ({
        id: c.category.id,
        name: c.category.name
      }))
    };

    return NextResponse.json(formattedDiscount);
  } catch (error) {
    console.error('Error fetching discount:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    // Handle date conversion if provided
    const data: Partial<DiscountUpdateData> = { ...body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom as string);
    if (data.validTo) data.validTo = new Date(data.validTo as string);

    // Update the discount (removed unused variable)
    await prisma.discount.update({
      where: { id },
      data: {
        ...data,
        // Don't allow updating these fields directly
        id: undefined,
        code: undefined
      }
    });

    // Update product relations if provided
    if (body.products) {
      // First, remove all existing product relations
      await prisma.productDiscount.deleteMany({
        where: { discountId: id }
      });

      // Then add the new ones
      if (body.products.length > 0) {
        await prisma.productDiscount.createMany({
          data: body.products.map((productId: string) => ({
            productId,
            discountId: id
          }))
        });
      }
    }

    // Update category relations if provided
    if (body.categories) {
      // First, remove all existing category relations
      await prisma.categoryDiscount.deleteMany({
        where: { discountId: id }
      });

      // Then add the new ones
      if (body.categories.length > 0) {
        await prisma.categoryDiscount.createMany({
          data: body.categories.map((categoryId: string) => ({
            categoryId,
            discountId: id
          }))
        });
      }
    }

    // Fetch the updated discount with relations
    const updatedDiscountWithRelations = await prisma.discount.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, title: true }
            }
          }
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedDiscountWithRelations);
  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // First, delete all related records
    await prisma.productDiscount.deleteMany({
      where: { discountId: id }
    });

    await prisma.categoryDiscount.deleteMany({
      where: { discountId: id }
    });

    await prisma.userDiscountUsage.deleteMany({
      where: { discountId: id }
    });

    // Then delete the discount
    await prisma.discount.delete({
      where: { id }
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}
