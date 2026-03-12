// ============================================
// SETTLE PENDING CRON ROUTE
// POST /api/cron/settle-pending - Trigger settlement job manually
// ============================================

import { NextResponse } from 'next/server';
import { withCronSecret, AuthenticatedRequest } from '@/middleware/auth';
import { runSettlePendingJob } from '@/cron/settle-pending';

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
// POST HANDLER - Run Settlement Job
// ============================================

async function postHandler(
    request: AuthenticatedRequest
): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        // Run the settlement job
        const result = await runSettlePendingJob();

        const duration = Date.now() - startTime;

        // Return success response with job results
        return NextResponse.json(
            {
                data: {
                    operation: 'settle-pending',
                    processed: result.processed,
                    failed: result.failed,
                    duration: `${result.duration}ms`,
                    totalDuration: `${duration}ms`,
                    errors: result.errors.length > 0 ? result.errors : undefined,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Settle pending cron route error:', error);
        return createErrorResponse(
            'Settlement job failed',
            'CRON_FAILED',
            500
        );
    }
}

// Export wrapped with cron secret middleware
export const POST = withCronSecret(postHandler);
