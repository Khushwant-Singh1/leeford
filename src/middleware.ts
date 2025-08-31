// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  
  // Get the token from the request
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  const isLoggedIn = !!token;
  const userRole = token?.role;

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
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    const requiredRoles = protectedRoutes[protectedPath];
    
    if (userRole && !requiredRoles.includes(userRole as string)) {
      // Redirect users without the required role to an unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  return NextResponse.next();
}

// This specifies which paths the middleware should run on.
export const config = {
  matcher: [
    "/admin/:path*", 
    "/editor/:path*", 
    "/profile/:path*",
    // Add API route protection
    "/api/admin/:path*"
  ],
};
