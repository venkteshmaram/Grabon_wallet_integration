// ============================================
// CRON JOBS REGISTRY
// Central registration point for all scheduled jobs
// ============================================

import { scheduleSettlePendingJob } from './settle-pending';
import { scheduleMatureFDsJob } from './mature-fds';
import { scheduleWeeklyAdvisorJob } from './weekly-advisor';

// ============================================
// STATE
// ============================================

let isInitialized = false;

// ============================================
// START ALL CRON JOBS
// ============================================

/**
 * Starts all cron jobs for the GrabCash wallet
 * 
 * This function should be called once when the Next.js server starts.
 * It registers all scheduled jobs:
 * - Settlement Job: Daily at midnight (00:00)
 * - FD Maturity Job: Daily at 1am (01:00)
 * - Weekly Advisor Job: Monday at 9am (09:00)
 * 
 * Jobs are protected against concurrent runs using internal flags.
 * All jobs run in Asia/Kolkata (IST) timezone.
 * 
 * Usage:
 * ```typescript
 * // In your server initialization file (e.g., instrumentation.ts)
 * import { startCronJobs } from '@/cron';
 * 
 * if (process.env.NODE_ENV === 'production') {
 *   startCronJobs();
 * }
 * ```
 */
export function startCronJobs(): void {
    // Prevent double initialization
    if (isInitialized) {
        console.log({
            operation: 'cron-startup',
            status: 'ALREADY_INITIALIZED',
            message: 'Cron jobs already started, skipping',
        });
        return;
    }

    console.log({
        operation: 'cron-startup',
        status: 'STARTING',
        jobs: ['settle-pending', 'mature-fds', 'weekly-advisor'],
    });

    try {
        // Register all cron schedules
        scheduleSettlePendingJob();
        scheduleMatureFDsJob();
        scheduleWeeklyAdvisorJob();

        isInitialized = true;

        console.log({
            operation: 'cron-startup',
            status: 'COMPLETED',
            jobs: ['settle-pending', 'mature-fds', 'weekly-advisor'],
            timezone: 'Asia/Kolkata',
            message: 'All cron jobs registered successfully',
        });
    } catch (error) {
        console.error({
            operation: 'cron-startup',
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Re-throw to fail fast - if cron jobs can't start, something is wrong
        throw error;
    }
}

// ============================================
// STOP ALL CRON JOBS (FOR TESTING)
// ============================================

/**
 * Stops all cron jobs
 * Useful for testing or graceful shutdown
 */
export function stopCronJobs(): void {
    // Note: node-cron doesn't provide a way to stop individual jobs
    // This is a placeholder for future implementation if needed
    console.log({
        operation: 'cron-shutdown',
        status: 'NOT_IMPLEMENTED',
        message: 'node-cron does not support stopping individual tasks',
    });
}

// ============================================
// STATUS CHECK
// ============================================

/**
 * Returns the initialization status of cron jobs
 */
export function areCronJobsRunning(): boolean {
    return isInitialized;
}

// ============================================
// MANUAL TRIGGER EXPORTS
// ============================================

/**
 * Export job functions for manual triggering via API routes
 * These allow admin/debug access to run jobs on demand
 */
export { runSettlePendingJob } from './settle-pending';
export { runMatureFDsJob } from './mature-fds';
export { runWeeklyAdvisorJob } from './weekly-advisor';
