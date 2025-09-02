import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAdmin } from '@/lib/auth-helper';
import * as z from 'zod';
import * as bcrypt from 'bcryptjs';
import { Role, Prisma, AuthMethod } from '@prisma/client';

// Schema for creating a new user
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.nativeEnum(Role).default(Role.USER),
});

/**
 * GET /api/admin/users
 * Lists all users with pagination, search, and sorting.
 */
export async function GET(req: NextRequest) {
    try {
      await checkAdmin(); // Protect the route
  
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const query = searchParams.get('query') || '';
  
      const skip = (page - 1) * limit;

      const whereClause: Prisma.UserWhereInput = query ? {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          // IMPORTANT: Never return the password
          select: {
            id: true, email: true, firstName: true, lastName: true, role: true, isVerified: true, createdAt: true
          }
        }),
        prisma.user.count({ where: whereClause }),
      ]);
  
      return NextResponse.json({
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
  
    } catch (error: any) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
      }
      if (error.message === 'Forbidden: Insufficient privileges') {
        return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
  }

/**
 * POST /api/admin/users
 * Creates a new user.
 */
export async function POST(req: Request) {
    try {
      await checkAdmin(); // Protect the route
  
      const body = await req.json();
      const validation = createUserSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
      }
      const { email, password, firstName, lastName, role } = validation.data;
      
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          authMethod: AuthMethod.EMAIL,
          isVerified: true,
        },
         select: {
            id: true, email: true, firstName: true, lastName: true, role: true, isVerified: true, createdAt: true
          }
      });
  
      return NextResponse.json(newUser, { status: 201 });
  
    } catch (error: any) {
       if (error.message === 'Not authenticated') {
        return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
      }
      if (error.message === 'Forbidden: Insufficient privileges') {
        return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
  }