# Security Logging System

This enhanced security logging system provides comprehensive logging capabilities for authentication, authorization, and security events in your application. It stores security events in the database and provides multiple interfaces for different use cases.

## Features

- **Database Storage**: All security events are stored in the `SecurityLog` table with structured data
- **Multiple Interfaces**: Basic functions, request-aware functions, convenience utilities, and direct class access
- **Request Context**: Automatically extracts IP address and user agent from requests
- **Type Safety**: Predefined security event types and TypeScript interfaces
- **Error Handling**: Graceful fallback to console logging if database fails
- **Convenience Utilities**: Pre-built functions for common authentication events

## Database Schema

The security events are stored in the `SecurityLog` table:

```prisma
enum SecurityEventLevel {
  INFO
  WARN
  ERROR
}

model SecurityLog {
  id        String             @id @default(cuid())
  createdAt DateTime           @default(now())
  
  eventType String
  level     SecurityEventLevel
  
  actor     String?
  ipAddress String?
  userAgent String?
  
  details   Json

  @@index([createdAt])
  @@index([eventType])
  @@index([actor])
}
```

## Usage Examples

### 1. Basic Usage (Original Signature)

```typescript
import { logSecurityEvent, SECURITY_EVENTS } from '@/lib/security-logger';

// Simple security event logging
await logSecurityEvent(SECURITY_EVENTS.AUTH_OTP_VERIFIED, { 
  userId: '123', 
  email: 'user@example.com' 
});
```

### 2. With Request Context

```typescript
import { logSecurityEventWithRequest, SECURITY_EVENTS } from '@/lib/security-logger';
import { SecurityEventLevel } from '@prisma/client';

// Automatically captures IP address and user agent from request
await logSecurityEventWithRequest(
  request,
  SECURITY_EVENTS.AUTH_OTP_FAILED,
  { email: 'user@example.com', attempt: 3 },
  SecurityEventLevel.WARN
);
```

### 3. Convenience Utilities

The `AuthLogger` class provides pre-built methods for common authentication events:

```typescript
import { AuthLogger } from '@/lib/security-logger';

// OTP events
await AuthLogger.otpSent('user@example.com', request);
await AuthLogger.otpVerified('user-123', 'user@example.com', request);
await AuthLogger.otpFailed('user@example.com', 3, request);

// Login events
await AuthLogger.loginSuccess('user-123', 'user@example.com', request);
await AuthLogger.loginFailed('user@example.com', 'invalid_password', request);
await AuthLogger.logout('user-123', 'user@example.com', request);

// Password events
await AuthLogger.passwordResetRequested('user@example.com', request);
await AuthLogger.passwordResetSuccess('user-123', 'user@example.com', request);
await AuthLogger.passwordChanged('user-123', 'user@example.com', request);

// Unauthorized access
await AuthLogger.unauthorizedAccess('/admin/dashboard', 'user-123', request);
```

### 4. Direct Class Usage

For advanced scenarios, use the `SecurityLogger` class directly:

```typescript
import { SecurityLogger, SECURITY_EVENTS } from '@/lib/security-logger';
import { SecurityEventLevel } from '@prisma/client';

const logger = SecurityLogger.getInstance();

await logger.log(SECURITY_EVENTS.DATA_ACCESS_UNAUTHORIZED, {
  userId: 'user-123',
  resourceId: 'document-456',
  action: 'view'
}, {
  level: SecurityEventLevel.ERROR,
  actor: 'user-123'
});
```

## Available Security Event Types

The system includes predefined security event types in `SECURITY_EVENTS`:

### Authentication Events
- `AUTH_LOGIN_SUCCESS`
- `AUTH_LOGIN_FAILED`
- `AUTH_LOGOUT`
- `AUTH_OTP_SENT`
- `AUTH_OTP_VERIFIED`
- `AUTH_OTP_FAILED`
- `AUTH_PASSWORD_RESET_REQUESTED`
- `AUTH_PASSWORD_RESET_SUCCESS`
- `AUTH_PASSWORD_CHANGED`

### Authorization Events
- `AUTH_UNAUTHORIZED_ACCESS`
- `AUTH_PERMISSION_DENIED`

### Data Access Events
- `DATA_ACCESS_UNAUTHORIZED`
- `DATA_MODIFICATION_UNAUTHORIZED`

### System Events
- `RATE_LIMIT_EXCEEDED`
- `SYSTEM_ERROR`
- `SYSTEM_WARNING`

## Security Event Levels

Events can be logged with different severity levels:

- `SecurityEventLevel.INFO` - Informational events (successful logins, etc.)
- `SecurityEventLevel.WARN` - Warning events (failed login attempts, etc.)
- `SecurityEventLevel.ERROR` - Error events (unauthorized access, system errors, etc.)

## API Route Implementation Examples

### Authentication Route

```typescript
import { AuthLogger, logSecurityEventWithRequest, SECURITY_EVENTS } from '@/lib/security-logger';
import { SecurityEventLevel } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // Your authentication logic here...
    const userId = 'user-123';
    const email = 'user@example.com';
    
    // Log successful authentication
    await AuthLogger.loginSuccess(userId, email, req);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    // Log authentication failure
    await AuthLogger.loginFailed('user@example.com', 'invalid_credentials', req);
    
    // Log system error
    await logSecurityEventWithRequest(
      req,
      SECURITY_EVENTS.SYSTEM_ERROR,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'user_authentication'
      },
      SecurityEventLevel.ERROR
    );
    
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
```

### Middleware Implementation

```typescript
import { AuthLogger } from '@/lib/security-logger';

export async function middleware(req: Request) {
  const isAuthenticated = false; // Your auth check logic
  const requestedPath = req.url;
  
  if (!isAuthenticated && requestedPath.startsWith('/admin')) {
    await AuthLogger.unauthorizedAccess(requestedPath, undefined, req);
    return new Response('Unauthorized', { status: 401 });
  }
}
```

## Best Practices

### 1. Choose the Right Interface

- **Basic events**: Use `logSecurityEvent()` for simple logging
- **Request context**: Use `logSecurityEventWithRequest()` when you have a request object
- **Auth events**: Use `AuthLogger` convenience methods for authentication-related events
- **Advanced scenarios**: Use `SecurityLogger` class directly for complex logging needs

### 2. Include Relevant Context

Always include relevant context in your security events:

```typescript
await logSecurityEventWithRequest(
  req,
  SECURITY_EVENTS.AUTH_LOGIN_FAILED,
  {
    email: 'user@example.com',
    reason: 'invalid_password',
    attemptNumber: 3,
    accountLocked: false
  },
  SecurityEventLevel.WARN
);
```

### 3. Use Appropriate Security Levels

- `INFO`: Successful operations, normal events
- `WARN`: Failed attempts, suspicious activity
- `ERROR`: Security violations, system errors

### 4. Handle Sensitive Data

Be careful not to log sensitive information like passwords or tokens:

```typescript
// ❌ Don't log sensitive data
await logSecurityEvent(SECURITY_EVENTS.AUTH_LOGIN_FAILED, {
  email: 'user@example.com',
  password: 'user-password' // Never log passwords!
});

// ✅ Log relevant context without sensitive data
await logSecurityEvent(SECURITY_EVENTS.AUTH_LOGIN_FAILED, {
  email: 'user@example.com',
  reason: 'invalid_password',
  ipAddress: '192.168.1.1'
});
```

## Querying Security Logs

You can query security logs using Prisma:

```typescript
// Get recent failed login attempts
const failedLogins = await prisma.securityLog.findMany({
  where: {
    eventType: SECURITY_EVENTS.AUTH_LOGIN_FAILED,
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    }
  },
  orderBy: { createdAt: 'desc' }
});

// Get all events for a specific user
const userEvents = await prisma.securityLog.findMany({
  where: {
    actor: 'user-123'
  },
  orderBy: { createdAt: 'desc' }
});

// Get error-level events
const errorEvents = await prisma.securityLog.findMany({
  where: {
    level: SecurityEventLevel.ERROR
  },
  orderBy: { createdAt: 'desc' }
});
```

## Error Handling

The security logger includes built-in error handling. If database logging fails, it will fall back to console logging:

```typescript
// If database fails, this will log to console instead
await logSecurityEvent(SECURITY_EVENTS.AUTH_LOGIN_SUCCESS, {
  userId: 'user-123',
  email: 'user@example.com'
});
```

## Migration from Basic Logging

If you have existing `logSecurityEvent` calls, you can easily migrate:

```typescript
// Old way
await logSecurityEvent('AUTH_LOGIN_SUCCESS', { userId: '123' });

// New way - using constants
await logSecurityEvent(SECURITY_EVENTS.AUTH_LOGIN_SUCCESS, { userId: '123' });

// Or with request context
await logSecurityEventWithRequest(req, SECURITY_EVENTS.AUTH_LOGIN_SUCCESS, { userId: '123' });

// Or using convenience methods
await AuthLogger.loginSuccess('123', 'user@example.com', req);
```

This enhanced security logging system provides comprehensive audit trails for your application's security events while maintaining flexibility and ease of use.
