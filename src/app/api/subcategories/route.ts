// src/app/api/subcategories/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const newSubCategory = await prisma.category.create({
      data: {
        name,
        description,
        slug,
        parentId,
      },
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
