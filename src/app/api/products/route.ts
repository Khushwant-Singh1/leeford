// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadImageToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const images = formData.getAll("images") as File[];

    const productData: any = {};
    formData.forEach((value, key) => {
      if (key !== "images" && key !== "variants") {
        productData[key] = value;
      }
    });

    // Type conversions
    productData.price = parseFloat(productData.price);
    productData.stockQuantity = parseInt(productData.stockQuantity, 10);
    if (productData.comparePrice) {
      productData.comparePrice = parseFloat(productData.comparePrice);
    }
    if (productData.lowStockThreshold) {
      productData.lowStockThreshold = parseInt(productData.lowStockThreshold, 10);
    }
    productData.isBestseller = productData.isBestseller === 'true';
    productData.isNewProduct = productData.isNewProduct === 'true';

    const imageUrls: string[] = [];
    if (images.length > 0) {
      for (const image of images) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const url = await uploadImageToS3(buffer, image.type);
        imageUrls.push(url);
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            position: index,
          })),
        },
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        return NextResponse.json(
            { error: "A product with this SKU already exists." },
            { status: 409 } 
        );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}