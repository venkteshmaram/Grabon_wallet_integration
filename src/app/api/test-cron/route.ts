// ============================================
// TEST CRON JOBS API ROUTE
// GET /api/test-cron - Test cron jobs manually (dev only)
// ============================================

import { NextResponse } from 'next/server';
import { runSettlePendingJob, runMatureFDsJob, runWeeklyAdvisorJob } from '@/cron';

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
// GET HANDLER - Run All Cron Jobs for Testing
// ============================================

export async function GET(): Promise<NextResponse> {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return createErrorResponse(
            'This endpoint is only available in development',
            'DEV_ONLY',
            403
        );
    }

    const startTime = Date.now();

    try {
        console.log({
            operation: 'test-cron',
            status: 'STARTED',
            message: 'Running all cron jobs for testing',
        });

        // Run all three cron jobs
        const [settleResult, matureResult, advisorResult] = await Promise.all([
            runSettlePendingJob(),
            runMatureFDsJob(),
            runWeeklyAdvisorJob(),
        ]);

        const duration = Date.now() - startTime;

        return NextResponse.json(
            {
                data: {
                    operation: 'test-cron',
                    status: 'COMPLETED',
                    duration: `${duration}ms`,
                    results: {
                        settlePending: {
                            processed: settleResult.processed,
                            failed: settleResult.failed,
                            duration: `${settleResult.duration}ms`,
                            errors: settleResult.errors.length > 0 ? settleResult.errors : undefined,
                        },
                        matureFDs: {
                            processed: matureResult.processed,
                            failed: matureResult.failed,
                            duration: `${matureResult.duration}ms`,
                            errors: matureResult.errors.length > 0 ? matureResult.errors : undefined,
                        },
                        weeklyAdvisor: {
                            processed: advisorResult.processed,
                            failed: advisorResult.failed,
                            duration: `${advisorResult.duration}ms`,
                            note: advisorResult.note,
                            errors: advisorResult.errors.length > 0 ? advisorResult.errors : undefined,
                        },
                    },
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Test cron error:', error);
        return createErrorResponse(
            'Test cron jobs failed',
            'TEST_CRON_FAILED',
            500
        );
    }
}
