// types/next-auth.d.ts

import { type DefaultSession } from "next-auth";

// Import the Role enum from your Prisma client
import { type Role } from "@prisma/client";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role: Role;
      /** The user's id. */
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's role. */
    role: Role;
    id: string;
  }
}