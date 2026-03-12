// ============================================
// USER FDs API ROUTE
// GET /api/fd/user/:userId - Get all FDs for a user
// ============================================

import { NextResponse } from 'next/server';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { getUserFDs } from '@/services/fd';
import { FDError } from '@/services/fd/fd-types';

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
// GET HANDLER - Get User FDs
// ============================================

async function getHandler(
    request: AuthenticatedRequest,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        // Get authenticated user ID
        const authUserId = extractUserId(request);
        const { userId } = params;

        // Verify user is accessing their own FDs
        if (authUserId !== userId) {
            return createErrorResponse(
                'You can only view your own FDs',
                'FORBIDDEN',
                403
            );
        }

        // Fetch user's FD portfolio
        const portfolio = await getUserFDs(userId);

        return NextResponse.json(
            {
                data: {
                    portfolio,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get user FDs error:', error);

        if (error instanceof FDError) {
            return createErrorResponse(
                error.message,
                error.code,
                400
            );
        }

        return createErrorResponse(
            'Failed to fetch FD portfolio',
            'FETCH_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const GET = withAuth(getHandler);
