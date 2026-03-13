// ============================================
// NEXT.JS SERVER INSTRUMENTATION
// Registers cron jobs when the server starts (Node.js runtime only)
// This file is automatically excluded from client bundles by Next.js
// ============================================

/**
 * Check if we're running in a browser/client environment
 */
function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

/**
 * Check if we're running in Edge Runtime
 * Edge Runtime doesn't support Node.js built-in modules like 'fs'
 */
function isEdgeRuntime(): boolean {
    return typeof (globalThis as Record<string, unknown>).__NEXT_EDGE_RUNTIME__ !== 'undefined' ||
        typeof (globalThis as Record<string, unknown>).EdgeRuntime !== 'undefined';
}

/**
 * Next.js instrumentation hook - runs when the server starts
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
    // Safety check: Never run in browser
    if (isBrowser()) {
        return;
    }

    // Skip in Edge Runtime - cron jobs need Node.js APIs
    if (isEdgeRuntime()) {
        console.log('[instrumentation] Skipped - Edge Runtime detected');
        return;
    }

    // Only start cron jobs in production or if explicitly enabled
    const shouldStartCron = process.env.NODE_ENV === 'production' ||
        process.env.ENABLE_CRON_JOBS === 'true';

    if (!shouldStartCron) {
        console.log('[instrumentation] Cron jobs skipped - not in production and ENABLE_CRON_JOBS not set');
        return;
    }

    console.log('[instrumentation] Starting cron jobs...');

    try {
        // Only run initialization in the Node.js runtime
        if (process.env.NEXT_RUNTIME !== 'nodejs') {
            return;
        }

        // Import and start cron jobs
        const { startCronJobs } = await import('@/cron');
        startCronJobs();
        console.log('[instrumentation] Cron jobs started successfully');
    } catch (error) {
        console.error('[instrumentation] Failed to start cron jobs:',
            error instanceof Error ? error.message : 'Unknown error');
        // Don't throw - server should start even if cron jobs fail
    }
}

/**
 * Called when the server is shutting down
 * Placeholder for graceful shutdown if needed in future
 */
export async function onRequestError(error: Error): Promise<void> {
    console.error({
        operation: 'server-error',
        error: error.message,
        stack: error.stack,
    });
}
