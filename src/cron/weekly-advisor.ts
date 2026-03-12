// ============================================
// WEEKLY ADVISOR CRON JOB
// Monday at 9am - runs Claude advisor for all users
// ============================================

import { prisma } from '@/lib/prisma';
import cron from 'node-cron';

// ============================================
// TYPES
// ============================================

interface AdvisorResult {
    processed: number;
    failed: number;
    duration: number;
    errors: Array<{ userId: string; error: string }>;
    note: string;
}

// ============================================
// STATE
// ============================================

let isJobRunning = false;

// ============================================
// MAIN JOB FUNCTION
// ============================================

/**
 * Runs the weekly advisor job for all users
 * 
 * NOTE: This is a STUB implementation for Phase 2.
 * Full Claude API integration will be implemented in Phase 3.
 * 
 * Current behavior:
 * - Fetches all user IDs from the database
 * - Logs each user with status 'STUB'
 * - Does NOT call Claude API (pending Phase 3)
 * 
 * Future behavior (Phase 3):
 * - For each user, builds context from wallet, ledger, and FD data
 * - Calls Claude API with context
 * - Stores recommendation in database
 * 
 * Business Rules:
 * - One failed user must never stop the entire batch
 * - Logs detailed results for observability
 * - Stub mode clearly indicated in all logs
 */
export async function runWeeklyAdvisorJob(): Promise<AdvisorResult> {
    const startTime = Date.now();

    // Prevent concurrent runs
    if (isJobRunning) {
        console.log({
            operation: 'weekly-advisor',
            status: 'SKIPPED',
            reason: 'Previous run still in progress',
        });
        return {
            processed: 0,
            failed: 0,
            duration: 0,
            errors: [],
            note: 'STUB: Skipped due to concurrent run',
        };
    }

    isJobRunning = true;

    const results: AdvisorResult = {
        processed: 0,
        failed: 0,
        duration: 0,
        errors: [],
        note: 'STUB: Phase 2 implementation - Claude API integration pending Phase 3',
    };

    try {
        console.log({
            operation: 'weekly-advisor',
            status: 'STARTED',
            mode: 'STUB',
            note: 'Phase 2: Logging users only, Claude integration in Phase 3',
        });

        // Fetch all user IDs from the database
        const users = await prisma.user.findMany({
            select: { id: true, email: true },
        });

        console.log({
            operation: 'weekly-advisor',
            usersFound: users.length,
        });

        // Process each user individually - one failure must not stop the batch
        // In Phase 2, we just log. In Phase 3, we'll call Claude API here.
        for (const user of users) {
            try {
                // STUB: Log that we would process this user
                // Phase 3: Build context and call Claude API
                console.log({
                    operation: 'weekly-advisor',
                    status: 'STUB',
                    userId: user.id,
                    email: user.email,
                    note: 'Phase 3: Will call Claude API with user context',
                });

                // Phase 3 Implementation TODO:
                // 1. const context = await buildAdvisorContext(user.id);
                // 2. const recommendation = await callClaudeAdvisor(context);
                // 3. await saveRecommendation(user.id, recommendation);

                results.processed++;
            } catch (error) {
                results.failed++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.errors.push({
                    userId: user.id,
                    error: errorMessage,
                });

                // Log individual failure but continue with next user
                console.error({
                    operation: 'weekly-advisor',
                    status: 'USER_FAILED',
                    userId: user.id,
                    error: errorMessage,
                });
            }
        }

        const duration = Date.now() - startTime;
        results.duration = duration;

        // Log completion summary
        console.log({
            operation: 'weekly-advisor',
            status: 'COMPLETED',
            mode: 'STUB',
            processed: results.processed,
            failed: results.failed,
            duration: `${duration}ms`,
            note: 'Phase 2 complete - Phase 3 will add Claude API calls',
        });

        return results;
    } catch (error) {
        // This catches errors in the main database query
        const duration = Date.now() - startTime;
        results.duration = duration;

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error({
            operation: 'weekly-advisor',
            status: 'FAILED',
            mode: 'STUB',
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
 * Schedules the weekly advisor job to run every Monday at 9am
 * Cron expression: 0 9 * * 1 (minute 0, hour 9, every Monday)
 */
export function scheduleWeeklyAdvisorJob(): void {
    // Every Monday at 9am
    const SCHEDULE = '0 9 * * 1';

    cron.schedule(SCHEDULE, async () => {
        console.log({
            operation: 'weekly-advisor',
            status: 'SCHEDULED_RUN_STARTED',
            schedule: SCHEDULE,
            mode: 'STUB',
        });

        try {
            await runWeeklyAdvisorJob();
        } catch (error) {
            // This should not happen as runWeeklyAdvisorJob handles its own errors,
            // but we add this as a safety net
            console.error({
                operation: 'weekly-advisor',
                status: 'SCHEDULED_RUN_ERROR',
                mode: 'STUB',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }, {
        timezone: 'Asia/Kolkata', // IST timezone
    });

    console.log({
        operation: 'cron-schedule',
        job: 'weekly-advisor',
        schedule: SCHEDULE,
        timezone: 'Asia/Kolkata',
        mode: 'STUB',
        note: 'Phase 2: Structure ready, Phase 3 will add Claude integration',
        status: 'REGISTERED',
    });
}
