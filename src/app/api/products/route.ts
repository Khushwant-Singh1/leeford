// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadImageToS3 } from "@/lib/s3";
import { productSchema } from "@/lib/validations/product-schema";
import { z } from "zod";
import { Prisma, ProductStatus } from "@prisma/client";

type ProductFormData = {
  title: string;
  description: string;
  price: string;
  stockQuantity: string;
  comparePrice?: string;
  lowStockThreshold?: string;
  isBestSeller?: string;
  isNewProduct?: string;
  status?: ProductStatus;
  categoryId: string;
  madeOf?: string;
  weight?: string;
  rating?: string;
  sku: string;
  images?: File[];
  variants?: Array<{
    name: string;
    price: string;
    sku: string;
    stock: string;
    attributes: Record<string, unknown>;
  }>;
};

/**
 * GET handler for fetching products with pagination and search.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const searchTerm = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProductWhereInput = searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { sku: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          category: true,
          images: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new product.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const images = formData.getAll("images") as File[];

    // Convert FormData to a plain object with proper typing
    const formDataObj: Partial<ProductFormData> = {};
    formData.forEach((value, key) => {
      if (key !== "images" && key !== "variants") {
        (formDataObj as any)[key] = value.toString();
      }
    });

    // Type conversions for validation
    const parsedData = {
      ...formDataObj,
      price: parseFloat(formDataObj.price || "0"),
      stockQuantity: parseInt(formDataObj.stockQuantity || "0", 10),
      comparePrice: formDataObj.comparePrice ? parseFloat(formDataObj.comparePrice) : null,
      lowStockThreshold: formDataObj.lowStockThreshold ? parseInt(formDataObj.lowStockThreshold, 10) : null,
      isBestSeller: formDataObj.isBestSeller === 'true',
      isNewProduct: formDataObj.isNewProduct === 'true',
      weight: formDataObj.weight ? parseFloat(formDataObj.weight) : undefined,
      rating: formDataObj.rating ? parseFloat(formDataObj.rating) : undefined,
    };

    const validationResult = productSchema.safeParse(parsedData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    if (!validatedData.categoryId) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Upload images to S3
    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        return uploadImageToS3(buffer, image.type);
      })
    );

    // Create product with images in a transaction
    const product = await prisma.$transaction(async (prisma) => {
      const newProduct = await prisma.product.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          price: validatedData.price,
          stockQuantity: validatedData.stockQuantity,
          comparePrice: validatedData.comparePrice,
          lowStockThreshold: validatedData.lowStockThreshold,
          isBestSeller: validatedData.isBestSeller || false,
          isNewProduct: validatedData.isNewProduct || false,
          status: validatedData.status || 'DRAFT',
          categoryId: validatedData.categoryId,
          madeOf: validatedData.madeOf || null,
          weight: validatedData.weight,
          rating: validatedData.rating,
          sku: validatedData.sku,
        },
      });

      // Add images
      if (imageUrls.length > 0) {
        await prisma.productImage.createMany({
          data: imageUrls.map((url, index) => ({
            url,
            position: index,
            productId: newProduct.id,
          })),
        });
      }

      return newProduct;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
