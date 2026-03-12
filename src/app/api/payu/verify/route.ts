// ============================================
// PAYU VERIFY PAYMENT API ROUTE
// GET /api/payu/verify?txnId=xxx
// Verifies payment status by transaction ID
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentStatus } from '@/services/payu';
import { PayUError } from '@/services/payu/payu-types';

// ============================================
// GET HANDLER - Verify Payment Status
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Get transaction ID from query params
        const { searchParams } = new URL(request.url);
        const txnId = searchParams.get('txnId');

        if (!txnId) {
            return NextResponse.json(
                {
                    error: {
                        message: 'Transaction ID is required',
                        code: 'MISSING_TXN_ID',
                    },
                },
                { status: 400 }
            );
        }

        // Verify payment status
        const result = await verifyPaymentStatus(txnId);

        return NextResponse.json(
            {
                success: result.success,
                txnId: result.txnId,
                amountPaisa: result.amountPaisa,
                amountRupees: (result.amountPaisa / 100).toFixed(2),
                message: result.message,
                ledgerEntryId: result.ledgerEntryId,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('PayU verify payment error:', error);

        if (error instanceof PayUError) {
            return NextResponse.json(
                {
                    error: {
                        message: error.message,
                        code: error.code,
                    },
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error: {
                    message: 'Failed to verify payment status',
                    code: 'VERIFICATION_FAILED',
                },
            },
            { status: 500 }
        );
    }
}
