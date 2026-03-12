// ============================================
// FRAUD CHECK API ROUTE
// POST /api/fraud/check - Run fraud check on a transaction
// ============================================

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { checkTransaction } from '@/services/fraud';
import { FraudError, FRAUD_ERROR_CODES } from '@/services/fraud/fraud-types';

// ============================================
// REQUEST VALIDATION SCHEMA
// ============================================

const fraudCheckSchema = z.object({
    amountPaisa: z.number().int().positive('Amount must be a positive integer in paisa'),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    merchantName: z.string().min(1, 'Merchant name is required'),
});

type FraudCheckRequest = z.infer<typeof fraudCheckSchema>;

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
// POST HANDLER - Check Transaction for Fraud
// ============================================

async function postHandler(
    request: AuthenticatedRequest
): Promise<NextResponse> {
    try {
        // Get authenticated user ID
        const userId = extractUserId(request);

        // Parse and validate request body
        const body = await request.json();
        const validationResult = fraudCheckSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e) => e.message).join(', ');
            return createErrorResponse(
                `Validation failed: ${errors}`,
                'VALIDATION_ERROR',
                400
            );
        }

        const { amountPaisa, merchantId, merchantName } = validationResult.data;

        // Run fraud check
        const result = await checkTransaction({
            userId,
            amountPaisa,
            merchantId,
            merchantName,
        });

        // Return appropriate response based on action
        const statusCode = result.action === 'BLOCK' ? 403 :
            result.action === 'FREEZE' ? 403 :
                result.action === 'REQUIRE_OTP' ? 202 :
                    200;

        return NextResponse.json(
            {
                data: {
                    isFlagged: result.isFlagged,
                    flagReason: result.flagReason,
                    action: result.action,
                    ruleTriggered: result.ruleTriggered,
                    message: result.isFlagged
                        ? `Transaction flagged: ${result.flagReason}`
                        : 'Transaction approved',
                },
            },
            { status: statusCode }
        );
    } catch (error) {
        console.error('Fraud check error:', error);

        if (error instanceof FraudError) {
            return createErrorResponse(
                error.message,
                error.code,
                400
            );
        }

        // Fail-safe: if fraud check fails, require OTP
        return NextResponse.json(
            {
                data: {
                    isFlagged: true,
                    flagReason: 'FRAUD_CHECK_ERROR',
                    action: 'REQUIRE_OTP',
                    ruleTriggered: null,
                    message: 'Fraud check failed. OTP required for safety.',
                },
            },
            { status: 202 }
        );
    }
}

// Export wrapped with auth middleware
export const POST = withAuth(postHandler);
