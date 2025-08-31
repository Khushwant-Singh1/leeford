import { prisma } from './db';
import { SecurityEventLevel } from '@prisma/client';

// Security event types for better type safety
export const SECURITY_EVENTS = {
  // Authentication events
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_OTP_SENT: 'AUTH_OTP_SENT',
  AUTH_OTP_VERIFIED: 'AUTH_OTP_VERIFIED',
  AUTH_OTP_FAILED: 'AUTH_OTP_FAILED',
  AUTH_PASSWORD_RESET_REQUESTED: 'AUTH_PASSWORD_RESET_REQUESTED',
  AUTH_PASSWORD_RESET_SUCCESS: 'AUTH_PASSWORD_RESET_SUCCESS',
  AUTH_PASSWORD_CHANGED: 'AUTH_PASSWORD_CHANGED',
  
  // Authorization events
  AUTH_UNAUTHORIZED_ACCESS: 'AUTH_UNAUTHORIZED_ACCESS',
  AUTH_PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
  
  // Data access events
  DATA_ACCESS_UNAUTHORIZED: 'DATA_ACCESS_UNAUTHORIZED',
  DATA_MODIFICATION_UNAUTHORIZED: 'DATA_MODIFICATION_UNAUTHORIZED',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // System events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING',
} as const;

export type SecurityEventType = typeof SECURITY_EVENTS[keyof typeof SECURITY_EVENTS];

// Security log options interface
export interface SecurityLogOptions {
  level?: SecurityEventLevel;
  actor?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Extract request information utility
function extractRequestInfo(request?: Request): Pick<SecurityLogOptions, 'ipAddress' | 'userAgent'> {
  if (!request) return {};
  
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

// Main SecurityLogger class
export class SecurityLogger {
  private static instance: SecurityLogger;

  private constructor() {}

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  async log(
    eventType: SecurityEventType,
    details: Record<string, any>,
    options: SecurityLogOptions = {}
  ): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          eventType,
          level: options.level || SecurityEventLevel.INFO,
          actor: options.actor,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          details,
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Fallback to console logging if database fails
      console.log('SECURITY EVENT:', {
        eventType,
        level: options.level || SecurityEventLevel.INFO,
        actor: options.actor,
        details,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Basic usage function (original signature)
export async function logSecurityEvent(
  eventType: SecurityEventType,
  data: Record<string, any>
): Promise<void> {
  const logger = SecurityLogger.getInstance();
  await logger.log(eventType, data);
}

// With request context function
export async function logSecurityEventWithRequest(
  request: Request,
  eventType: SecurityEventType,
  data: Record<string, any>,
  level: SecurityEventLevel = SecurityEventLevel.INFO
): Promise<void> {
  const logger = SecurityLogger.getInstance();
  const requestInfo = extractRequestInfo(request);
  
  await logger.log(eventType, data, {
    level,
    ...requestInfo,
  });
}

// Convenience utilities for common auth events
export class AuthLogger {
  private static logger = SecurityLogger.getInstance();

  static async loginSuccess(userId: string, email: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_LOGIN_SUCCESS, {
      userId,
      email,
    }, {
      level: SecurityEventLevel.INFO,
      actor: userId,
      ...requestInfo,
    });
  }

  static async loginFailed(email: string, reason: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_LOGIN_FAILED, {
      email,
      reason,
    }, {
      level: SecurityEventLevel.WARN,
      ...requestInfo,
    });
  }

  static async otpSent(emailOrPhone: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_OTP_SENT, {
      recipient: emailOrPhone,
    }, {
      level: SecurityEventLevel.INFO,
      ...requestInfo,
    });
  }

  static async otpVerified(userId: string, emailOrPhone: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_OTP_VERIFIED, {
      userId,
      recipient: emailOrPhone,
    }, {
      level: SecurityEventLevel.INFO,
      actor: userId,
      ...requestInfo,
    });
  }

  static async otpFailed(emailOrPhone: string, attempt: number, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_OTP_FAILED, {
      recipient: emailOrPhone,
      attempt,
    }, {
      level: SecurityEventLevel.WARN,
      ...requestInfo,
    });
  }

  static async passwordResetRequested(email: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_PASSWORD_RESET_REQUESTED, {
      email,
    }, {
      level: SecurityEventLevel.INFO,
      ...requestInfo,
    });
  }

  static async passwordResetSuccess(userId: string, email: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_PASSWORD_RESET_SUCCESS, {
      userId,
      email,
    }, {
      level: SecurityEventLevel.INFO,
      actor: userId,
      ...requestInfo,
    });
  }

  static async passwordChanged(userId: string, email: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_PASSWORD_CHANGED, {
      userId,
      email,
    }, {
      level: SecurityEventLevel.INFO,
      actor: userId,
      ...requestInfo,
    });
  }

  static async unauthorizedAccess(path: string, userId?: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_UNAUTHORIZED_ACCESS, {
      path,
      userId,
    }, {
      level: SecurityEventLevel.ERROR,
      actor: userId,
      ...requestInfo,
    });
  }

  static async logout(userId: string, email: string, request?: Request): Promise<void> {
    const requestInfo = extractRequestInfo(request);
    await this.logger.log(SECURITY_EVENTS.AUTH_LOGOUT, {
      userId,
      email,
    }, {
      level: SecurityEventLevel.INFO,
      actor: userId,
      ...requestInfo,
    });
  }
}