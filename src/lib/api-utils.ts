// lib/api-utils.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Safely parse JSON from request body with proper error handling
 */
export async function safeParseJSON(req: NextRequest): Promise<{ data: any; error?: NextResponse }> {
  try {
    const text = await req.text();
    
    if (!text || text.trim() === '') {
      return {
        data: null,
        error: NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        )
      };
    }

    const data = JSON.parse(text);
    
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        data: null,
        error: NextResponse.json(
          { error: 'Request body must be a valid JSON object' },
          { status: 400 }
        )
      };
    }

    return { data };
  } catch (error) {
    console.error('JSON parsing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    };
  }
}

/**
 * Check authentication and authorization for admin routes
 */
export async function checkAdminAuth(): Promise<{ user: any; error?: NextResponse }> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    if (session.user.role !== 'ADMIN') {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Admin privileges required' },
          { status: 403 }
        )
      };
    }

    return { user: session.user };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    };
  }
}

/**
 * Validate request data with Zod schema and proper error formatting
 */
export function validateData<T>(schema: any, data: any): { validated: T | null; error?: NextResponse } {
  const validation = schema.safeParse(data);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    console.error('Validation errors:', errors);
    
    return {
      validated: null,
      error: NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors 
        },
        { status: 400 }
      )
    };
  }

  return { validated: validation.data as T };
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 500, details?: any) {
  const response = {
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };
  
  console.error('API Error:', response);
  return NextResponse.json(response, { status });
}

/**
 * Standard success response helper
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}
