// ============================================
// PAYU WEBHOOK API ROUTE
// POST /api/payu/webhook
// Receives PayU payment callbacks (success and failure)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { processPayUWebhook, sanitizeWebhookParams } from '@/services/payu';
import { PayUError } from '@/services/payu/payu-types';

// ============================================
// POST HANDLER - PayU Webhook
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
    const requestId = crypto.randomUUID();

    try {
        // Parse form data from PayU (webhooks are form-encoded)
        const formData = await request.formData();
        const params: Record<string, string | undefined> = {};

        // Convert FormData to plain object
        formData.forEach((value, key) => {
            params[key] = value.toString();
        });

        // Log sanitized request (for debugging, never log sensitive data)
        console.log(`[${requestId}] PayU webhook received:`, {
            txnid: params.txnid,
            status: params.status,
            amount: params.amount,
        });

        // Process the webhook
        const result = await processPayUWebhook(params);

        // Return 200 to acknowledge receipt (PayU expects this)
        return NextResponse.json(
            {
                success: result.success,
                message: result.message,
                txnId: result.txnId,
                status: result.status,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(`[${requestId}] PayU webhook error:`, error);

        // Even on error, return 200 to prevent PayU retries
        // Log the error internally but acknowledge receipt
        return NextResponse.json(
            {
                success: false,
                message: 'Webhook received but processing failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 200 }
        );
    }
}

// ============================================
// GET HANDLER - For manual testing/verification
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
    return NextResponse.json(
        {
            message: 'PayU webhook endpoint is active. Use POST for webhooks.',
            timestamp: new Date().toISOString(),
        },
        { status: 200 }
    );
}
