// src/app/api/categories/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PATCH handler for updating a category.
 * @param {Request} req - The incoming request object.
 * @param {RouteContext} context - Contains the route parameters, including the category ID.
 * @returns {Promise<NextResponse>} A response containing the updated category.
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure params is awaited before destructuring
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }
    const { name, description } = await req.json();

    const data: { name?: string; description?: string; slug?: string } = {};

    if (name) {
      data.name = name;
      let baseSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      
      // Check for slug uniqueness and add counter if needed (excluding current record)
      let counter = 1;
      let finalSlug = baseSlug;
      
      while (true) {
        const existingCategory = await prisma.category.findUnique({
          where: { slug: finalSlug }
        });
        
        if (!existingCategory || existingCategory.id === id) {
          break;
        }
        
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      data.slug = finalSlug;
    }

    if (description) {
      data.description = description;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error(`Failed to update category with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a specific category by its ID.
 * @param {Request} _req - The incoming request object (unused).
 * @param {RouteContext} context - Contains the route parameters, including the category ID.
 * @returns {Promise<NextResponse>} A response indicating success or failure.
 */
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure params is awaited before destructuring
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Failed to delete category with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
