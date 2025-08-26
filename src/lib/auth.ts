// lib/auth.ts

import NextAuth, { type DefaultSession, type User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { type Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { prisma } from "./db";

type AuthUser = User & {
  role: Role;
  id: string;
};

type AuthSession = DefaultSession & {
  user: AuthUser;
};

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: AuthUser;
  }

  interface JWT {
    role?: Role;
    id?: string;
  }
}

/**
 * Your NextAuth configuration options.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use the Prisma adapter to connect NextAuth with your database.
  adapter: PrismaAdapter(prisma),

  // Configure one or more authentication providers.
  providers: [
    CredentialsProvider({
      // The name to display on the sign-in form (e.g., "Sign in with...")
      name: "Credentials",
      credentials: {
        emailOrPhone: {
          label: "Email or Phone Number",
          type: "text",
          placeholder: "john.doe@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log('🔐 NextAuth authorize called with:', {
            emailOrPhone: credentials?.emailOrPhone,
            hasPassword: !!credentials?.password,
          });

          // Add logic here to look up the user from the credentials supplied.
          if (!credentials?.emailOrPhone || !credentials.password) {
            console.log('❌ Missing credentials');
            return null;
          }

          // Find the user by either email or phone number.
          console.log('🔍 Looking for user with:', credentials.emailOrPhone);
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.emailOrPhone as string },
                { phoneNumber: credentials.emailOrPhone as string },
              ],
            },
          });

          if (!user) {
            console.log('❌ No user found with email/phone:', credentials.emailOrPhone);
            // If you return null, then an error will be displayed to the user.
            return null;
          }

          console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isVerified: user.isVerified,
          });

          // Check if the password is correct.
          console.log('🔐 Comparing passwords...');
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordCorrect) {
            console.log('❌ Password incorrect');
            return null;
          }

          console.log('✅ Password correct, authentication successful');

          // Return a user object that will be embedded in the JWT.
          // This object must include the properties you want in the session.
          const authUser = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
          
          console.log('✅ Returning user object:', authUser);
          return authUser;
        } catch (error) {
          console.error('💥 Error in authorize function:', error);
          return null;
        }
      },
    }),
  ],

  // Use JSON Web Tokens for session management.
  session: {
    strategy: "jwt",
  },

  // Callbacks are asynchronous functions you can use to control what happens
  // when an action is performed.
  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    async jwt({ token, user }: { token: any; user?: any }) {
      // When the user signs in, the `user` object from `authorize` is passed here.
      // We are adding the user's role to the token.
      if (user) {
        token.role = user.role;
        token.email = user.email;
      }
      
      return token;
    },

    // This callback is called whenever a session is checked.
    async session({ session, token }: { session: any; token: any }) {
      // We are adding the user's ID and role from the token to the session object.
      // The `sub` property of the token contains the user's ID.
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
      }
      
      return session;
    },
  },

  // Specify custom pages for sign-in, sign-out, error, etc.
  pages: {
    signIn: "/login",
    // You can add other pages here if needed.
    // error: '/auth/error',
  },
});

/**
 * A helper function to get the server-side session.
 * This is a convenient wrapper around the auth function from NextAuth v5.
 *
 * @returns {Promise<AuthSession | null>} The session object or null.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await auth();
  return session as unknown as AuthSession | null;
}

/**
 * A Higher-Order Function to protect pages or API routes based on user roles.
 *
 * @param {...Role[]} allowedRoles - The roles that are allowed to access the resource.
 * @returns A function that takes a handler and returns a new function with role checks.
 */
export const withRoles =
  (...allowedRoles: Role[]) =>
  async (handler: (session: AuthSession) => any) => {
    const session = await getAuthSession();

    // If there is no session or the user's role is not in the allowed list, redirect.
    if (!session || !allowedRoles.includes(session.user.role)) {
      // For server-side rendering (e.g., in `getServerSideProps`)
      return {
        redirect: {
          destination: "/unauthorized", // Or back to login
          permanent: false,
        },
      };
    }

    // If the user has the required role, execute the original handler.
    return handler(session);
  };
