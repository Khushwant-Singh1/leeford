// src/app/api/categories/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadImageToS3 } from "@/lib/s3";

/**
 * GET handler for fetching all categories.
 * @returns {Promise<NextResponse>} A response containing the list of categories.
 */
export async function GET() {
  try {
    // Fetch all categories (both main categories and subcategories)
    const categories = await prisma.category.findMany({
      include: {
        parent: true, // Include parent info for subcategories
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: [
        { parentId: 'asc' }, // Main categories first (null parentId)
        { name: 'asc' }
      ]
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new category.
 * @param {Request} req - The incoming request object.
 * @returns {Promise<NextResponse>} A response containing the new category.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const parentId = formData.get("parentId") as string | null;
    const imageFile = formData.get("image") as File | null;

    if (!name) {
      return NextResponse.json(
        { error: '"name" is a required field' },
        { status: 400 }
      );
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await uploadImageToS3(buffer, imageFile.type);
    }

    // Create a base slug
    const baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Check if a category with this slug already exists
    let slug = baseSlug;
    const slugExists = await prisma.category.findUnique({
      where: { slug }
    });

    // If slug exists, append a timestamp to make it unique
    if (slugExists) {
      const timestamp = Date.now();
      slug = `${baseSlug}-${timestamp}`;
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        description,
        slug,
        parentId: parentId || undefined,
        image: imageUrl,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
