// ============================================
// WALLET API ROUTE
// GET /api/wallet/:userId - Get wallet balance
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { getWalletBalance } from '@/services/wallet';
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
// GET HANDLER - Get Wallet Balance
// ============================================

async function getHandler(
    request: AuthenticatedRequest,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        // Get authenticated user ID
        const authUserId = extractUserId(request);
        const { userId } = params;

        // Verify user is accessing their own wallet
        if (authUserId !== userId) {
            return createErrorResponse(
                'You can only access your own wallet',
                'FORBIDDEN',
                403
            );
        }

        // Fetch wallet balance
        const balance = await getWalletBalance(userId);

        return NextResponse.json(
            {
                data: {
                    balance,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get wallet error:', error);

        if (error instanceof WalletError) {
            if (error.code === 'WALLET_NOT_FOUND') {
                return createErrorResponse(
                    'Wallet not found for user',
                    'WALLET_NOT_FOUND',
                    404
                );
            }
        }

        return createErrorResponse(
            'Failed to fetch wallet balance',
            'FETCH_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const GET = withAuth(getHandler);
