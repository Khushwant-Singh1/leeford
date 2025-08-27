// src/app/api/subcategories/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * GET handler for fetching all subcategories.
 * @param {Request} req - The incoming request object.
 * @returns {Promise<NextResponse>} A response containing the list of subcategories.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');
    
    const whereClause = parentId 
      ? { parentId } 
      : { parentId: { not: null } }; // All subcategories if no parentId specified

    const subcategories = await prisma.category.findMany({
      where: whereClause,
      include: {
        parent: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(subcategories);
  } catch (error) {
    console.error("Failed to fetch subcategories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new sub-category.
 * @param {Request} req - The incoming request object.
 * @returns {Promise<NextResponse>} A response containing the new sub-category.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, parentId } = await req.json();

    if (!name || !parentId) {
      return NextResponse.json(
        { error: '"name" and "parentId" are required fields' },
        { status: 400 }
      );
    }

    // Verify the parent category exists and is not a subcategory itself
    const parentCategory = await prisma.category.findUnique({
      where: { 
        id: parentId,
        parentId: null // Ensure parent is a main category
      },
    });

    if (!parentCategory) {
      return NextResponse.json(
        { error: "Invalid parent category. Parent must be a main category." },
        { status: 400 }
      );
    }

    // Generate slug with parent category to ensure uniqueness
    const baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    
    const parentSlug = parentCategory.slug || parentCategory.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    
    let slug = `${parentSlug}-${baseSlug}`;
    
    // Check for slug uniqueness and add counter if needed
    let counter = 1;
    let finalSlug = slug;
    
    while (true) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: finalSlug }
      });
      
      if (!existingCategory) {
        break;
      }
      
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const newSubCategory = await prisma.category.create({
      data: {
        name,
        description,
        slug: finalSlug,
        parentId,
      },
      include: {
        parent: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return NextResponse.json(newSubCategory, { status: 201 });
  } catch (error) {
    console.error("Failed to create sub-category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
