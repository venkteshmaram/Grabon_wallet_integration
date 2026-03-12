// ============================================
// MATURE FDS CRON ROUTE
// POST /api/cron/mature-fds - Trigger FD maturity job
// ============================================

import { NextResponse } from 'next/server';
import { withCronSecret, AuthenticatedRequest } from '@/middleware/auth';
import { getFDsDueForMaturity, matureFD } from '@/services/fd';

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
// POST HANDLER - Run FD Maturity Job
// ============================================

async function postHandler(
    request: AuthenticatedRequest
): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        // Get FDs due for maturity
        const fdsDue = await getFDsDueForMaturity();

        const results = {
            processed: 0,
            failed: 0,
            errors: [] as Array<{ userId: string; fdId: string; error: string }>,
        };

        // Process each FD
        for (const fd of fdsDue) {
            try {
                await matureFD(fd.id);
                results.processed++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    userId: fd.userId,
                    fdId: fd.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        const duration = Date.now() - startTime;

        // Log results
        console.log({
            operation: 'mature-fds',
            processed: results.processed,
            failed: results.failed,
            duration: `${duration}ms`,
        });

        return NextResponse.json(
            {
                data: {
                    operation: 'mature-fds',
                    processed: results.processed,
                    failed: results.failed,
                    duration: `${duration}ms`,
                    errors: results.errors.length > 0 ? results.errors : undefined,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Mature FDs cron error:', error);
        return createErrorResponse(
            'FD maturity job failed',
            'CRON_FAILED',
            500
        );
    }
}

// Export wrapped with cron secret middleware
export const POST = withCronSecret(postHandler);
