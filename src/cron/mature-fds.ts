// ============================================
// MATURE FDS CRON JOB
// Daily at 1am - matures FDs past their maturity date
// ============================================

import { getFDsDueForMaturity, matureFD } from '@/services/fd/fd-service';
import cron from 'node-cron';

// ============================================
// TYPES
// ============================================

interface MaturityResult {
    processed: number;
    failed: number;
    duration: number;
    errors: Array<{ userId: string; fdId: string; error: string }>;
}

// ============================================
// STATE
// ============================================

let isJobRunning = false;

// ============================================
// MAIN JOB FUNCTION
// ============================================

/**
 * Runs the FD maturity job - matures all FDs whose maturity date
 * has passed (maturityDate <= now())
 * 
 * Business Rules:
 * - One failed FD must never stop the entire batch
 * - Each maturity is idempotent (status check prevents double-maturity)
 * - Logs detailed results for observability
 */
export async function runMatureFDsJob(): Promise<MaturityResult> {
    const startTime = Date.now();

    // Prevent concurrent runs
    if (isJobRunning) {
        console.log({
            operation: 'mature-fds',
            status: 'SKIPPED',
            reason: 'Previous run still in progress',
        });
        return {
            processed: 0,
            failed: 0,
            duration: 0,
            errors: [],
        };
    }

    isJobRunning = true;

    const results: MaturityResult = {
        processed: 0,
        failed: 0,
        duration: 0,
        errors: [],
    };

    try {
        console.log({
            operation: 'mature-fds',
            status: 'STARTED',
        });

        // Get all FDs due for maturity
        const fdsDue = await getFDsDueForMaturity();

        console.log({
            operation: 'mature-fds',
            fdsFound: fdsDue.length,
        });

        // Process each FD individually - one failure must not stop the batch
        for (const fd of fdsDue) {
            try {
                await matureFD(fd.id);
                results.processed++;
            } catch (error) {
                results.failed++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push({
                    userId: fd.userId,
                    fdId: fd.id,
                    error: errorMessage,
                });

                // Log individual failure but continue with next FD
                console.error({
                    operation: 'mature-fds',
                    status: 'ENTRY_FAILED',
                    userId: fd.userId,
                    fdId: fd.id,
                    error: errorMessage,
                });
            }
        }

        const duration = Date.now() - startTime;
        results.duration = duration;

        // Log completion summary
        console.log({
            operation: 'mature-fds',
            status: 'COMPLETED',
            processed: results.processed,
            failed: results.failed,
            duration: `${duration}ms`,
        });

        return results;
    } catch (error) {
        // This catches errors in getFDsDueForMaturity itself
        const duration = Date.now() - startTime;
        results.duration = duration;

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error({
            operation: 'mature-fds',
            status: 'FAILED',
            error: errorMessage,
            duration: `${duration}ms`,
        });

        return results;
    } finally {
        isJobRunning = false;
    }
}

// ============================================
// SCHEDULER
// ============================================

/**
 * Schedules the FD maturity job to run daily at 1am
 * Cron expression: 0 1 * * * (minute 0, hour 1, every day)
 */
export function scheduleMatureFDsJob(): void {
    // Daily at 1am
    const SCHEDULE = '0 1 * * *';

    cron.schedule(SCHEDULE, async () => {
        console.log({
            operation: 'mature-fds',
            status: 'SCHEDULED_RUN_STARTED',
            schedule: SCHEDULE,
        });

        try {
            await runMatureFDsJob();
        } catch (error) {
            // This should not happen as runMatureFDsJob handles its own errors,
            // but we add this as a safety net
            console.error({
                operation: 'mature-fds',
                status: 'SCHEDULED_RUN_ERROR',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }, {
        timezone: 'Asia/Kolkata', // IST timezone
    });

    console.log({
        operation: 'cron-schedule',
        job: 'mature-fds',
        schedule: SCHEDULE,
        timezone: 'Asia/Kolkata',
        status: 'REGISTERED',
    });
}
