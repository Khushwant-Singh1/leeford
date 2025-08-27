// src/app/api/subcategories/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET handler for fetching a specific subcategory by its ID.
 * @param {Request} _req - The incoming request object (unused).
 * @param {RouteContext} context - Contains the route parameters, including the subcategory ID.
 * @returns {Promise<NextResponse>} A response containing the subcategory data.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    
    const subcategory = await prisma.category.findUnique({
      where: { 
        id,
        parentId: { not: null } // Ensure it's a subcategory
      },
      include: {
        parent: true,
        products: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
    });

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subcategory);
  } catch (error) {
    console.error("Failed to fetch subcategory:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating a subcategory.
 * @param {Request} req - The incoming request object.
 * @param {RouteContext} context - Contains the route parameters, including the subcategory ID.
 * @returns {Promise<NextResponse>} A response containing the updated subcategory.
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const { name, description, parentId } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: '"name" is a required field' },
        { status: 400 }
      );
    }

    // Verify the subcategory exists and is actually a subcategory
    const existingSubcategory = await prisma.category.findUnique({
      where: { 
        id,
        parentId: { not: null }
      },
    });

    if (!existingSubcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    // If parentId is provided, verify the parent category exists and is not a subcategory itself
    let parentCategory = null;
    if (parentId) {
      parentCategory = await prisma.category.findUnique({
        where: { 
          id: parentId,
          parentId: null // Ensure parent is a main category
        },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Invalid parent category" },
          { status: 400 }
        );
      }
    } else {
      // Get existing parent category for slug generation
      const existingSubcategory = await prisma.category.findUnique({
        where: { id },
        include: { parent: true }
      });
      
      if (existingSubcategory?.parent) {
        parentCategory = existingSubcategory.parent;
      }
    }

    // Generate slug with parent category to ensure uniqueness
    let baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    
    let slug = baseSlug;
    if (parentCategory) {
      const parentSlug = parentCategory.slug || parentCategory.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      
      slug = `${parentSlug}-${baseSlug}`;
    }
    
    // Check for slug uniqueness and add counter if needed (excluding current record)
    let counter = 1;
    let finalSlug = slug;
    
    while (true) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: finalSlug }
      });
      
      if (!existingCategory || existingCategory.id === id) {
        break;
      }
      
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const updatedSubcategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        slug: finalSlug,
        ...(parentId && { parentId }),
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

    return NextResponse.json(updatedSubcategory);
  } catch (error) {
    console.error("Failed to update subcategory:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a specific subcategory by its ID.
 * @param {Request} _req - The incoming request object (unused).
 * @param {RouteContext} context - Contains the route parameters, including the subcategory ID.
 * @returns {Promise<NextResponse>} A response indicating success or failure.
 */
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // Verify the subcategory exists and is actually a subcategory
    const existingSubcategory = await prisma.category.findUnique({
      where: { 
        id,
        parentId: { not: null }
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!existingSubcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    // Check if subcategory has products
    if (existingSubcategory._count.products > 0) {
      return NextResponse.json(
        { error: "Cannot delete subcategory with associated products. Please reassign or delete the products first." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error("Failed to delete subcategory:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
