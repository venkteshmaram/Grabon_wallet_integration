// ============================================
// FD DETAILS API ROUTE
// GET /api/fd/:fdId - Get individual FD details
// ============================================

import { NextResponse } from 'next/server';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { getFDById } from '@/services/fd';
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
// GET HANDLER - Get FD Details
// ============================================

async function getHandler(
    request: AuthenticatedRequest,
    { params }: { params: { fdId: string } }
): Promise<NextResponse> {
    try {
        // Get authenticated user ID
        const authUserId = extractUserId(request);
        const { fdId } = params;

        if (!fdId) {
            return createErrorResponse(
                'FD ID is required',
                'MISSING_FD_ID',
                400
            );
        }

        // Fetch FD details (service handles ownership check)
        const fd = await getFDById(fdId, authUserId);

        return NextResponse.json(
            {
                data: {
                    fd,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Get FD ${params.fdId} error:`, error);

        if (error instanceof FDError) {
            const statusCode = error.code === 'UNAUTHORIZED_ACCESS' ? 403 : 
                             error.code === 'FD_NOT_FOUND' ? 404 : 400;
            return createErrorResponse(
                error.message,
                error.code,
                statusCode
            );
        }

        return createErrorResponse(
            'Failed to fetch FD details',
            'FETCH_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const GET = withAuth(getHandler);
