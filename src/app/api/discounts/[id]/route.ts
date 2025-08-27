import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const discount = await prisma.discount.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Handle date conversion if provided
    const data: any = { ...body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.validTo) data.validTo = new Date(data.validTo);

    // Update the discount
    const updatedDiscount = await prisma.discount.update({
      where: { id: params.id },
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
        where: { discountId: params.id }
      });

      // Then add the new ones
      if (body.products.length > 0) {
        await prisma.productDiscount.createMany({
          data: body.products.map((productId: string) => ({
            productId,
            discountId: params.id
          }))
        });
      }
    }

    // Update category relations if provided
    if (body.categories) {
      // First, remove all existing category relations
      await prisma.categoryDiscount.deleteMany({
        where: { discountId: params.id }
      });

      // Then add the new ones
      if (body.categories.length > 0) {
        await prisma.categoryDiscount.createMany({
          data: body.categories.map((categoryId: string) => ({
            categoryId,
            discountId: params.id
          }))
        });
      }
    }

    // Fetch the updated discount with relations
    const updatedDiscountWithRelations = await prisma.discount.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, delete all related records
    await prisma.productDiscount.deleteMany({
      where: { discountId: params.id }
    });

    await prisma.categoryDiscount.deleteMany({
      where: { discountId: params.id }
    });

    await prisma.userDiscountUsage.deleteMany({
      where: { discountId: params.id }
    });

    // Then delete the discount
    await prisma.discount.delete({
      where: { id: params.id }
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
