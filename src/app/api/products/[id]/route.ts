// src/app/api/products/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadImageToS3 } from "@/lib/s3";
import { z } from "zod";
import { ProductStatus } from "@prisma/client";

// Zod schema for validating product updates
const productUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long.").optional(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive("Price must be a positive number.").optional(),
  stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative.").optional(),
  comparePrice: z.coerce.number().positive("Compare price must be positive.").optional().nullable(),
  lowStockThreshold: z.coerce.number().int().min(0).optional().nullable(),
  isBestSeller: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  isNewProduct: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  categoryId: z.string().cuid("Invalid category ID").optional().nullable(),
  material: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const images = formData.getAll("images") as File[];

    const productData: { [key: string]: any } = {};
    formData.forEach((value, key) => {
      if (key !== "images" && key !== "variants") {
        productData[key] = value;
      }
    });

    // Validate the form data against the Zod schema
    const validationResult = productUpdateSchema.safeParse(productData);
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const validatedData = validationResult.data;

    const imageUrls: string[] = [];
    if (images.length > 0) {
      for (const image of images) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const url = await uploadImageToS3(buffer, image.type);
        imageUrls.push(url);
      }
    }

    // Filter out undefined values before passing data to Prisma
    const dataToUpdate: any = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    );

    if (imageUrls.length > 0) {
      dataToUpdate.images = {
        // This will add new images, but won't remove old ones.
        // For a full replacement, you'd delete existing images first.
        create: imageUrls.map((url, index) => ({
          url,
          position: index,
        })),
      };
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use a transaction to delete related items first if necessary
    await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Use a partial schema for PATCH requests
    const validationResult = productUpdateSchema.partial().safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    // Filter out undefined values before passing data to Prisma
    const dataToUpdate = Object.fromEntries(
      Object.entries(validationResult.data).filter(([_, v]) => v !== undefined)
    );

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}