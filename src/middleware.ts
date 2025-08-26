// middleware.ts

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req: { auth?: any; nextUrl?: any; }) => {
  const { nextUrl } = req;
  
  const isLoggedIn = !!req.auth;
  
  // In NextAuth v5, the user role might be stored differently
  // Let's check both token.role and user.role
  const userRole = req.auth?.user?.role || req.auth?.token?.role || req.auth?.role;

  // Define protected routes and their required roles
  const protectedRoutes: Record<string, string[]> = {
    "/admin": ["ADMIN"],
    "/editor": ["ADMIN", "EDITOR"],
    "/profile": ["ADMIN", "EDITOR", "USER"],
  };

  const protectedPath = Object.keys(protectedRoutes).find((path) =>
    nextUrl.pathname.startsWith(path)
  );

  if (protectedPath) {
    if (!isLoggedIn) {
      // Redirect unauthenticated users to the login page
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    const requiredRoles = protectedRoutes[protectedPath];
    
    if (!requiredRoles.includes(userRole)) {
      // Redirect users without the required role to an unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  return NextResponse.next();
});

// This specifies which paths the middleware should run on.
export const config = {
  matcher: ["/admin/:path*", "/editor/:path*", "/profile/:path*"],
};
