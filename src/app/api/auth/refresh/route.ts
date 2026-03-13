// ============================================
// TOKEN REFRESH API ROUTE
// POST /api/auth/refresh - Refresh JWT token
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';

// ============================================
// ERROR RESPONSE HELPER
// ============================================

function createErrorResponse(message: string, code: string, status: number = 400) {
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
// POST HANDLER - Refresh Token
// ============================================

async function postHandler(
    request: AuthenticatedRequest
): Promise<NextResponse> {
    try {
        // Get user ID from current token
        const userId = extractUserId(request);
        const email = request.user?.email;

        if (!email) {
            return createErrorResponse(
                'Invalid token payload',
                'INVALID_TOKEN',
                401
            );
        }

        // Check JWT_SECRET is configured
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET not configured');
            return createErrorResponse(
                'Server configuration error',
                'SERVER_ERROR',
                500
            );
        }

        // Generate new JWT with fresh expiry
        const token = jwt.sign(
            { userId, email },
            jwtSecret,
            { expiresIn: (process.env.JWT_EXPIRY || '48h') as jwt.SignOptions['expiresIn'] }
        );

        return NextResponse.json(
            {
                data: {
                    token,
                    message: 'Token refreshed successfully',
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Token refresh error:', error);
        return createErrorResponse(
            'Token refresh failed',
            'REFRESH_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const POST = withAuth(postHandler);
