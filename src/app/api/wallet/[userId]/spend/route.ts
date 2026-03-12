// ============================================
// SPEND BALANCE API ROUTE
// POST /api/wallet/:userId/spend - Deduct available balance for PayU
// ============================================

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { spendBalance } from '@/services/wallet';
import { WalletError } from '@/services/wallet/wallet-types';

// ============================================
// REQUEST VALIDATION SCHEMA
// ============================================

const spendBalanceSchema = z.object({
    amountPaisa: z.number().int().positive('Amount must be a positive integer in paisa'),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    merchantName: z.string().min(1, 'Merchant name is required'),
    description: z.string().optional(),
});

type SpendBalanceRequest = z.infer<typeof spendBalanceSchema>;

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
// POST HANDLER - Spend Balance
// ============================================

async function postHandler(
    request: AuthenticatedRequest,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        // Get authenticated user ID
        const authUserId = extractUserId(request);
        const { userId } = params;

        // Verify user is spending from their own wallet
        if (authUserId !== userId) {
            return createErrorResponse(
                'You can only spend from your own wallet',
                'FORBIDDEN',
                403
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validationResult = spendBalanceSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e) => e.message).join(', ');
            return createErrorResponse(
                `Validation failed: ${errors}`,
                'VALIDATION_ERROR',
                400
            );
        }

        const { amountPaisa, merchantId, merchantName, description } = validationResult.data;

        // Spend balance
        const entry = await spendBalance({
            userId,
            amountPaisa,
            merchantId,
            merchantName,
            description: description || `Payment to ${merchantName}`,
        });

        return NextResponse.json(
            {
                data: {
                    entry,
                    message: 'Payment processed successfully',
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Spend balance error:', error);

        if (error instanceof WalletError) {
            const status = error.code === 'INSUFFICIENT_BALANCE' ? 400 : 400;
            return createErrorResponse(
                error.message,
                error.code,
                status
            );
        }

        return createErrorResponse(
            'Failed to process payment',
            'SPEND_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const POST = withAuth(postHandler);
