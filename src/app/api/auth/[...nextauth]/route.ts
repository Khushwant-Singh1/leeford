// app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/lib/auth";

/**
 * This is the single, dynamic API route that handles all NextAuth.js functionality,
 * such as sign-in, sign-out, session management, and more.
 *
 * In NextAuth v5 with App Router, we export the handlers as GET and POST.
 */
export const { GET, POST } = handlers;
