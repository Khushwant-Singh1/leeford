import { getAuthSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Checks if the current session belongs to an admin.
 * Throws an error if the user is not authenticated or not an admin.
 * @returns The authenticated admin session user.
 */
export async function checkAdmin() {
  const session = await getAuthSession();

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  if (session.user.role !== Role.ADMIN) {
    throw new Error("Forbidden: Insufficient privileges");
  }

  return session.user;
}