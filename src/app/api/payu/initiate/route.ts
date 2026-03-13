// ============================================
// PAYU INITIATE PAYMENT API ROUTE
// POST /api/payu/initiate
// Initiates a PayU payment with fraud check and hash generation
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { initiatePayment } from '@/services/payu';
import { PayUError } from '@/services/payu/payu-types';

// ============================================
// REQUEST VALIDATION SCHEMA
// ============================================

const initiatePaymentSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    amountPaisa: z.number().int().positive('Amount must be a positive integer in paisa'),
    merchantId: z.string().min(1, 'Merchant ID is required'),
    merchantName: z.string().min(1, 'Merchant name is required'),
    productInfo: z.string().optional(),
    appliedBalancePaisa: z.number().int().nonnegative().optional(),
});

type InitiatePaymentRequest = z.infer<typeof initiatePaymentSchema>;

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
// POST HANDLER - Initiate Payment
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request
        const validationResult = initiatePaymentSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e: { message: string }) => e.message).join(', ');
            return createErrorResponse(
                `Validation failed: ${errors}`,
                'VALIDATION_ERROR',
                400
            );
        }

        const { userId, amountPaisa, merchantId, merchantName, productInfo } = validationResult.data;

        // Initiate payment
        const result = await initiatePayment({
            userId,
            amountPaisa,
            merchantId,
            merchantName,
            productInfo,
            appliedBalancePaisa: validationResult.data.appliedBalancePaisa,
        });

        // If fraud check triggered, return fraud result
        if (result.isFlagged) {
            const statusCode = result.fraudAction === 'REQUIRE_OTP' ? 202 : 403;
            return NextResponse.json(
                {
                    success: false,
                    isFlagged: true,
                    flagReason: result.flagReason,
                    fraudAction: result.fraudAction,
                    message: result.fraudAction === 'REQUIRE_OTP' 
                        ? 'Additional verification required' 
                        : 'Transaction blocked by fraud detection',
                },
                { status: statusCode }
            );
        }

        // Return PayU params for frontend redirect
        return NextResponse.json(
            {
                success: true,
                isFlagged: false,
                txnId: result.txnId,
                payuBaseUrl: result.payuBaseUrl,
                payuParams: result.payuParams,
                message: 'Payment initiated successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('PayU initiate payment error:', error);

        // Handle specific PayU errors
        if (error instanceof PayUError) {
            const statusCode = getErrorStatusCode(error.code);
            return createErrorResponse(error.message, error.code, statusCode);
        }

        // Handle generic errors
        return createErrorResponse(
            'Failed to initiate payment',
            'PAYMENT_INITIATION_FAILED',
            500
        );
    }
}

// ============================================
// ERROR STATUS CODE MAPPING
// ============================================

function getErrorStatusCode(code: string): number {
    const statusMap: Record<string, number> = {
        'MISSING_PAYU_CONFIG': 500,
        'TRANSACTION_NOT_FOUND': 404,
        'INSUFFICIENT_BALANCE': 400,
        'INVALID_AMOUNT': 400,
        'HASH_VERIFICATION_FAILED': 400,
        'FRAUD_BLOCKED': 403,
        'PAYU_ERROR': 500,
        'WEBHOOK_PROCESSING_FAILED': 500,
    };

    return statusMap[code] || 400;
}
