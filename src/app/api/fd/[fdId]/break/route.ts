// ============================================
// FD BREAK API ROUTE
// POST /api/fd/:fdId/break - Premature FD withdrawal
// ============================================

import { NextResponse } from 'next/server';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { breakFDEarly } from '@/services/fd';
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
// POST HANDLER - Break FD Early
// ============================================

async function postHandler(
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

        // Break FD early (service handles ownership and lock period checks)
        const result = await breakFDEarly(fdId, authUserId);

        return NextResponse.json(
            {
                success: true,
                data: result,
                message: 'FD broken successfully. Funds transferred to wallet available balance.',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Break FD ${params.fdId} error:`, error);

        if (error instanceof FDError) {
            const statusCode = error.code === 'UNAUTHORIZED_ACCESS' ? 403 : 
                             error.code === 'FD_NOT_FOUND' ? 404 : 
                             error.code === 'FD_LOCK_PERIOD_ACTIVE' ? 403 : 400;
            return createErrorResponse(
                error.message,
                error.code,
                statusCode
            );
        }

        return createErrorResponse(
            'Failed to break FD',
            'BREAK_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const POST = withAuth(postHandler);
