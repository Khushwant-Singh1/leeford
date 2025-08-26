// src/app/api/products/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadImageToS3 } from "@/lib/s3";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const formData = await req.formData();
    const images = formData.getAll("images") as File[];

    const productData: any = {};
    formData.forEach((value, key) => {
      if (key !== "images" && key !== "variants") {
        productData[key] = value;
      }
    });

    // Type conversions
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.stockQuantity) productData.stockQuantity = parseInt(productData.stockQuantity, 10);
    if (productData.comparePrice) productData.comparePrice = parseFloat(productData.comparePrice);
    if (productData.lowStockThreshold) productData.lowStockThreshold = parseInt(productData.lowStockThreshold, 10);
    if (productData.isBestseller) productData.isBestseller = productData.isBestseller === 'true';
    if (productData.isNewProduct) productData.isNewProduct = productData.isNewProduct === 'true';

    const imageUrls: string[] = [];
    if (images.length > 0) {
      for (const image of images) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const url = await uploadImageToS3(buffer, image.type);
        imageUrls.push(url);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(imageUrls.length > 0 && {
          images: {
            create: imageUrls.map((url, index) => ({
              url,
              position: index, // This might need adjustment if you want to preserve order with existing images
            })),
          },
        }),
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error(`Failed to update product with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.product.delete({
      where: { id : params.id},
    });
    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Failed to delete product with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error(`Failed to update product with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
