// lib/auth-guard.ts
import { auth } from "@/lib/auth";

export async function assertAdminOrEditor() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthenticated");

  // Ensure user.role is defined before checking
  if (!session.user.role || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    throw new Error("Forbidden");
  }
}