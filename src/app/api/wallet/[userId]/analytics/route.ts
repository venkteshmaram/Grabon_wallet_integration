// ============================================
// WALLET ANALYTICS API ROUTE
// GET /api/wallet/:userId/analytics - Get category breakdown and monthly trend
// ============================================

import { NextResponse } from 'next/server';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { getWalletAnalytics } from '@/services/wallet';
import { WalletError } from '@/services/wallet/wallet-types';

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
// GET HANDLER - Get Wallet Analytics
// ============================================

async function getHandler(
    request: AuthenticatedRequest,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        // Get authenticated user ID
        const authUserId = extractUserId(request);
        const { userId } = params;

        // Verify user is accessing their own analytics
        if (authUserId !== userId) {
            return createErrorResponse(
                'You can only access your own analytics',
                'FORBIDDEN',
                403
            );
        }

        // Fetch wallet analytics
        const analytics = await getWalletAnalytics(userId);

        return NextResponse.json(
            {
                data: {
                    analytics,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get analytics error:', error);

        if (error instanceof WalletError) {
            return createErrorResponse(
                error.message,
                error.code,
                400
            );
        }

        return createErrorResponse(
            'Failed to fetch wallet analytics',
            'FETCH_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const GET = withAuth(getHandler);
