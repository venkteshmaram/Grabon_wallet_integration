// ============================================
// SETTLE PENDING CRON JOB
// Daily at midnight - settles cashback older than 24 hours
// ============================================

import { getPendingEntriesOlderThan } from '@/services/wallet/ledger-service';
import { settlePendingEntry } from '@/services/wallet/wallet-service';
import { CASHBACK_SETTLEMENT_HOURS } from '@/lib/constants';
import cron from 'node-cron';

// ============================================
// TYPES
// ============================================

interface SettlementResult {
    processed: number;
    failed: number;
    duration: number;
    errors: Array<{ userId: string; entryId: string; error: string }>;
}

// ============================================
// STATE
// ============================================

let isJobRunning = false;

// ============================================
// MAIN JOB FUNCTION
// ============================================

/**
 * Runs the settlement job - settles all pending cashback entries
 * older than the configured settlement hours (default 24 hours)
 * 
 * Business Rules:
 * - One failed entry must never stop the entire batch
 * - Each settlement is idempotent (status check prevents double-settlement)
 * - Logs detailed results for observability
 */
export async function runSettlePendingJob(): Promise<SettlementResult> {
    const startTime = Date.now();

    // Prevent concurrent runs
    if (isJobRunning) {
        console.log({
            operation: 'settle-pending',
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

    const results: SettlementResult = {
        processed: 0,
        failed: 0,
        duration: 0,
        errors: [],
    };

    try {
        console.log({
            operation: 'settle-pending',
            status: 'STARTED',
            thresholdHours: CASHBACK_SETTLEMENT_HOURS,
        });

        // Get all pending entries older than the threshold
        const pendingEntries = await getPendingEntriesOlderThan(CASHBACK_SETTLEMENT_HOURS);

        console.log({
            operation: 'settle-pending',
            entriesFound: pendingEntries.length,
        });

        // Process each entry individually - one failure must not stop the batch
        for (const entry of pendingEntries) {
            try {
                await settlePendingEntry(entry.id);
                results.processed++;
            } catch (error) {
                results.failed++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push({
                    userId: entry.userId,
                    entryId: entry.id,
                    error: errorMessage,
                });

                // Log individual failure but continue with next entry
                console.error({
                    operation: 'settle-pending',
                    status: 'ENTRY_FAILED',
                    userId: entry.userId,
                    entryId: entry.id,
                    error: errorMessage,
                });
            }
        }

        const duration = Date.now() - startTime;
        results.duration = duration;

        // Log completion summary
        console.log({
            operation: 'settle-pending',
            status: 'COMPLETED',
            processed: results.processed,
            failed: results.failed,
            duration: `${duration}ms`,
        });

        return results;
    } catch (error) {
        // This catches errors in getPendingEntriesOlderThan itself
        const duration = Date.now() - startTime;
        results.duration = duration;

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error({
            operation: 'settle-pending',
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
 * Schedules the settlement job to run daily at midnight (00:00)
 * Cron expression: 0 0 * * * (minute 0, hour 0, every day)
 */
export function scheduleSettlePendingJob(): void {
    // Daily at midnight
    const SCHEDULE = '0 0 * * *';

    cron.schedule(SCHEDULE, async () => {
        console.log({
            operation: 'settle-pending',
            status: 'SCHEDULED_RUN_STARTED',
            schedule: SCHEDULE,
        });

        try {
            await runSettlePendingJob();
        } catch (error) {
            // This should not happen as runSettlePendingJob handles its own errors,
            // but we add this as a safety net
            console.error({
                operation: 'settle-pending',
                status: 'SCHEDULED_RUN_ERROR',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }, {
        timezone: 'Asia/Kolkata', // IST timezone
    });

    console.log({
        operation: 'cron-schedule',
        job: 'settle-pending',
        schedule: SCHEDULE,
        timezone: 'Asia/Kolkata',
        status: 'REGISTERED',
    });
}
