// src/app/api/products/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadImageToS3 } from "@/lib/s3";
import { Product, ProductStatus } from "@prisma/client";
import { productSchema } from "@/lib/validations/product-schema";
import { z } from "zod";

type ProductUpdateData = Partial<z.infer<typeof productSchema>> & {
  images?: string[];
  variants?: Array<{
    id?: string;
    name: string;
    price: number;
    sku: string;
    stock: number;
    attributes: Record<string, unknown>;
  }>;
};

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

    const productData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (key !== "images" && key !== "variants") {
        productData[key] = value;
      }
    });

    // Validate the form data against the Zod schema
    const validationResult = productUpdateSchema.safeParse(productData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
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
    const dataToUpdate: ProductUpdateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined && v !== null)
    ) as ProductUpdateData;

    if (imageUrls.length > 0) {
      // Delete existing images first for a full replacement
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });
      
      // Add new images
      await prisma.productImage.createMany({
        data: imageUrls.map((url, index) => ({
          url,
          position: index,
          productId: id,
        })),
      });
    }

    // Extract variants, images from data, and other data
    const { variants, images: dataImages, ...productDataToUpdate } = dataToUpdate;
    
    // Update the product with proper type handling
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...productDataToUpdate,
        // Handle optional fields
        categoryId: productDataToUpdate.categoryId || null,
        taxCategoryId: productDataToUpdate.taxCategoryId || null,
      },
      include: {
        images: true,
        variants: true,
      },
    });
    
    // Handle variants if provided
    if (variants && variants.length > 0) {
      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });
      
      // Create new variants
      await prisma.productVariant.createMany({
        data: variants.map(variant => ({
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stock || 0,
          attributes: variant.attributes as any,
          productId: id,
        })),
      });
    }

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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Failed to update product status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
