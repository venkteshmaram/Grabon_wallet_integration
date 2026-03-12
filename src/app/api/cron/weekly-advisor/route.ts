// ============================================
// WEEKLY ADVISOR CRON ROUTE
// POST /api/cron/weekly-advisor - Trigger weekly advisor job manually
// ============================================

import { NextResponse } from 'next/server';
import { withCronSecret, AuthenticatedRequest } from '@/middleware/auth';
import { runWeeklyAdvisorJob } from '@/cron/weekly-advisor';

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
// POST HANDLER - Run Weekly Advisor Job
// ============================================

async function postHandler(
    request: AuthenticatedRequest
): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        // Run the weekly advisor job
        const result = await runWeeklyAdvisorJob();

        const duration = Date.now() - startTime;

        // Return success response with job results
        return NextResponse.json(
            {
                data: {
                    operation: 'weekly-advisor',
                    processed: result.processed,
                    failed: result.failed,
                    duration: `${result.duration}ms`,
                    totalDuration: `${duration}ms`,
                    note: result.note,
                    errors: result.errors.length > 0 ? result.errors : undefined,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Weekly advisor cron route error:', error);
        return createErrorResponse(
            'Weekly advisor job failed',
            'CRON_FAILED',
            500
        );
    }
}

// Export wrapped with cron secret middleware
export const POST = withCronSecret(postHandler);
