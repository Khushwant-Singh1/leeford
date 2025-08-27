// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadImageToS3 } from "@/lib/s3";
import { productSchema } from "@/lib/validations/product-schema";
import { z } from "zod";
import { Prisma } from "@prisma/client"; // Import Prisma type for where clauses

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

    // FIX: Explicitly type the whereClause to match Prisma's expected input type.
    const whereClause: Prisma.ProductWhereInput = searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { sku: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {};

    // Fetch products and total count in parallel for efficiency
    const [products, totalProducts] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            orderBy: { position: "asc" },
            take: 1, // Only get the first image for the table view
          },
        },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalItems: totalProducts,
        itemsPerPage: limit,
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

    const productData: any = {};
    formData.forEach((value, key) => {
      if (key !== "images" && key !== "variants") {
        productData[key] = value;
      }
    });

    // Type conversions for validation
    const parsedData = {
      ...productData,
      price: parseFloat(productData.price),
      stockQuantity: parseInt(productData.stockQuantity, 10),
      comparePrice: productData.comparePrice ? parseFloat(productData.comparePrice) : undefined,
      lowStockThreshold: productData.lowStockThreshold ? parseInt(productData.lowStockThreshold, 10) : undefined,
      isBestSeller: productData.isBestseller === 'true',
      isNewProduct: productData.isNewProduct === 'true',
      weight: productData.weight ? parseFloat(productData.weight) : undefined,
      rating: productData.rating ? parseFloat(productData.rating) : undefined,
    };

    const validationResult = productSchema.safeParse(parsedData);

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.flatten().fieldErrors }, { status: 400 });
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
        { error: "Invalid category" },
        { status: 400 }
      );
    }

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
        ...validatedData,
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
