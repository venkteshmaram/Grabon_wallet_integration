// ============================================
// CREDIT CASHBACK API ROUTE
// POST /api/wallet/:userId/credit - Create pending cashback entry
// ============================================

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { creditCashback } from '@/services/wallet';
import { WalletError } from '@/services/wallet/wallet-types';

// ============================================
// REQUEST VALIDATION SCHEMA
// ============================================

const creditCashbackSchema = z.object({
    amountPaisa: z.number().int().positive('Amount must be a positive integer in paisa'),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    merchantName: z.string().min(1, 'Merchant name is required'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
});

type CreditCashbackRequest = z.infer<typeof creditCashbackSchema>;

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
// POST HANDLER - Credit Cashback
// ============================================

async function postHandler(
    request: AuthenticatedRequest,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        // Get authenticated user ID
        const authUserId = extractUserId(request);
        const { userId } = params;

        // Verify user is crediting their own wallet
        if (authUserId !== userId) {
            return createErrorResponse(
                'You can only credit your own wallet',
                'FORBIDDEN',
                403
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validationResult = creditCashbackSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e) => e.message).join(', ');
            return createErrorResponse(
                `Validation failed: ${errors}`,
                'VALIDATION_ERROR',
                400
            );
        }

        const { amountPaisa, merchantId, merchantName, category, description } = validationResult.data;

        // Credit cashback
        const entry = await creditCashback({
            userId,
            amountPaisa,
            merchantId,
            merchantName,
            category,
            description: description || `${merchantName} cashback`,
        });

        return NextResponse.json(
            {
                data: {
                    entry,
                    message: 'Cashback credited successfully. Will be available after settlement.',
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Credit cashback error:', error);

        if (error instanceof WalletError) {
            return createErrorResponse(
                error.message,
                error.code,
                400
            );
        }

        if (error instanceof z.ZodError) {
            return createErrorResponse(
                `Invalid input: ${error.issues.map(i => i.message).join(', ')}`,
                'VALIDATION_ERROR',
                400
            );
        }

        return createErrorResponse(
            'Failed to credit cashback',
            'CREDIT_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const POST = withAuth(postHandler);
