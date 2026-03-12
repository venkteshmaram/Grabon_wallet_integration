// ============================================
// AUTH MIDDLEWARE - JWT VERIFICATION
// Extracts and verifies JWT tokens from requests
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// ============================================
// TYPES
// ============================================

export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
    user?: JWTPayload;
}

// ============================================
// ERROR RESPONSE HELPER
// ============================================

function createErrorResponse(message: string, code: string, status: number = 401) {
    return NextResponse.json(
        {
            error: {
                message,
                code,
            },
        },
        { status }
    );
}

// ============================================
// VERIFY JWT TOKEN
// ============================================

export function verifyToken(token: string): JWTPayload {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
    }

    return jwt.verify(token, jwtSecret) as JWTPayload;
}

// ============================================
// EXTRACT TOKEN FROM HEADER
// ============================================

export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
        return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}

// ============================================
// WITH AUTH HIGHER-ORDER FUNCTION
// Wraps route handlers with JWT verification
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAuth(handler: (req: AuthenticatedRequest, ctx: any) => Promise<NextResponse> | NextResponse) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (request: NextRequest, context: any): Promise<NextResponse> => {
        try {
            // Extract Authorization header
            const authHeader = request.headers.get('Authorization');
            const token = extractTokenFromHeader(authHeader);

            if (!token) {
                return createErrorResponse(
                    'Authorization header missing or malformed. Expected: Bearer <token>',
                    'MISSING_AUTH_HEADER'
                );
            }

            // Verify token
            let payload: JWTPayload;
            try {
                payload = verifyToken(token);
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    return createErrorResponse(
                        'Token has expired',
                        'TOKEN_EXPIRED',
                        401
                    );
                }
                if (error instanceof jwt.JsonWebTokenError) {
                    return createErrorResponse(
                        'Invalid token',
                        'INVALID_TOKEN',
                        401
                    );
                }
                throw error;
            }

            // Attach user to request
            const authRequest = request as AuthenticatedRequest;
            authRequest.user = payload;

            // Call the handler
            return handler(authRequest, context);
        } catch (error) {
            console.error('Auth middleware error:', error);
            return createErrorResponse(
                'Authentication failed',
                'AUTH_FAILED',
                500
            );
        }
    };
}

// ============================================
// EXTRACT USER ID FROM REQUEST
// ============================================

export function extractUserId(request: AuthenticatedRequest): string {
    if (!request.user?.userId) {
        throw new Error('User ID not found in request. Ensure withAuth middleware is used.');
    }
    return request.user.userId;
}

// ============================================
// OPTIONAL AUTH - For routes that work with or without auth
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withOptionalAuth(handler: (req: AuthenticatedRequest, ctx: any) => Promise<NextResponse> | NextResponse) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (request: NextRequest, context: any): Promise<NextResponse> => {
        try {
            const authHeader = request.headers.get('Authorization');
            const token = extractTokenFromHeader(authHeader);

            const authRequest = request as AuthenticatedRequest;

            if (token) {
                try {
                    const payload = verifyToken(token);
                    authRequest.user = payload;
                } catch {
                    // Invalid token is okay for optional auth
                }
            }

            return handler(authRequest, context);
        } catch (error) {
            console.error('Optional auth middleware error:', error);
            return handler(request as AuthenticatedRequest, context);
        }
    };
}

// ============================================
// CRON AUTH - For cron job routes
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withCronSecret(handler: (req: AuthenticatedRequest, ctx: any) => Promise<NextResponse> | NextResponse) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (request: NextRequest, context: any): Promise<NextResponse> => {
        try {
            const cronSecret = request.headers.get('X-Cron-Secret');
            const expectedSecret = process.env.CRON_SECRET;

            if (!expectedSecret) {
                return createErrorResponse(
                    'Cron secret not configured on server',
                    'CRON_NOT_CONFIGURED',
                    500
                );
            }

            if (cronSecret !== expectedSecret) {
                return createErrorResponse(
                    'Invalid cron secret',
                    'INVALID_CRON_SECRET',
                    403
                );
            }

            return handler(request as AuthenticatedRequest, context);
        } catch (error) {
            console.error('Cron auth error:', error);
            return createErrorResponse(
                'Cron authentication failed',
                'CRON_AUTH_FAILED',
                500
            );
        }
    };
}
