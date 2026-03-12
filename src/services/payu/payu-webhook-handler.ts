// ============================================
// PAYU WEBHOOK HANDLER
// Processes PayU callback webhooks with idempotency and security
// ============================================

import {
    PayUResponseParams,
    WebhookProcessingResult,
    PayUError,
    PAYU_ERROR_CODES,
} from './payu-types';

import {
    handlePayUSuccess,
    handlePayUFailure,
    verifyPaymentStatus,
} from './payu-service';

import { verifyPayUResponseHash } from './payu-hash';

// Track processed webhooks for idempotency
const processedWebhooks = new Set<string>();

// ============================================
// MAIN WEBHOOK PROCESSOR
// ============================================

/**
 * Processes PayU webhook callbacks
 *
 * This is the main entry point for all PayU webhooks.
 * It handles both success and failure callbacks with proper
 * security verification and idempotency.
 *
 * @param responseParams - Parameters received from PayU
 * @returns WebhookProcessingResult
 */
export async function processPayUWebhook(
    responseParams: Record<string, string | undefined>
): Promise<WebhookProcessingResult> {
    // Step 1: Parse and validate parameters
    const parsedParams = parseWebhookParams(responseParams);
    const txnId = parsedParams.txnid;

    try {
        // Step 2: Check for duplicate webhook (idempotency)
        const webhookKey = `${txnId}_${parsedParams.status}`;
        if (isWebhookProcessed(webhookKey)) {
            return {
                success: true,
                txnId,
                status: 'SUCCESS',
                message: 'Webhook already processed (idempotent)',
            };
        }

        // Step 3: Verify hash before processing
        const isHashValid = verifyPayUResponseHash(parsedParams);

        if (!isHashValid) {
            // Log security issue but don't expose details
            markWebhookProcessed(webhookKey);

            throw new PayUError(
                'Hash verification failed - possible tampering',
                PAYU_ERROR_CODES.HASH_VERIFICATION_FAILED,
                txnId
            );
        }

        // Step 4: Route to appropriate handler based on status
        let result: WebhookProcessingResult;

        if (parsedParams.status === 'success') {
            const successResult = await handlePayUSuccess(parsedParams);

            result = {
                success: successResult.success,
                txnId,
                status: 'SUCCESS',
                message: successResult.message,
                ledgerEntryId: successResult.ledgerEntryId,
            };
        } else {
            const failureResult = await handlePayUFailure(parsedParams);

            result = {
                success: false,
                txnId,
                status: 'FAILURE',
                message: failureResult.message,
            };
        }

        // Step 5: Mark as processed for idempotency
        markWebhookProcessed(webhookKey);

        return result;
    } catch (error) {
        // Log error without exposing sensitive details
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
            success: false,
            txnId,
            status: 'FAILURE',
            message: `Webhook processing failed: ${errorMessage}`,
        };
    }
}

// ============================================
// PARAMETER PARSING
// ============================================

/**
 * Parses and validates webhook parameters from PayU
 * Ensures all required fields are present
 *
 * @param params - Raw parameters from request body
 * @returns Parsed PayUResponseParams
 * @throws PayUError if required fields are missing
 */
function parseWebhookParams(
    params: Record<string, string | undefined>
): PayUResponseParams {
    const txnid = params.txnid;
    const status = params.status;
    const hash = params.hash;

    if (!txnid) {
        throw new PayUError(
            'Missing required field: txnid',
            PAYU_ERROR_CODES.PAYU_ERROR
        );
    }

    if (!status) {
        throw new PayUError(
            'Missing required field: status',
            PAYU_ERROR_CODES.PAYU_ERROR,
            txnid
        );
    }

    if (!hash) {
        throw new PayUError(
            'Missing required field: hash',
            PAYU_ERROR_CODES.PAYU_ERROR,
            txnid
        );
    }

    return {
        txnid,
        status: status as 'success' | 'failure' | 'pending',
        hash,
        amount: params.amount || '0',
        email: params.email || '',
        firstname: params.firstname || '',
        productinfo: params.productinfo || '',
        error_Message: params.error_Message,
        error: params.error,
        mode: params.mode,
        mihpayid: params.mihpayid,
        bank_ref_num: params.bank_ref_num,
        udf1: params.udf1,
        udf2: params.udf2,
        udf3: params.udf3,
        udf4: params.udf4,
        udf5: params.udf5,
        ...params, // Include any additional fields
    };
}

// ============================================
// IDEMPOTENCY HANDLING
// ============================================

/**
 * Checks if a webhook has already been processed
 * Uses in-memory set - in production, use Redis or database
 */
function isWebhookProcessed(webhookKey: string): boolean {
    return processedWebhooks.has(webhookKey);
}

/**
 * Marks a webhook as processed
 * In production, store in database with TTL
 */
function markWebhookProcessed(webhookKey: string): void {
    processedWebhooks.add(webhookKey);

    // Auto-cleanup after 24 hours to prevent memory leak
    setTimeout(() => {
        processedWebhooks.delete(webhookKey);
    }, 24 * 60 * 60 * 1000);
}

// ============================================
// WEBHOOK URL BUILDERS
// ============================================

/**
 * Builds the success webhook URL
 * Used by frontend to redirect after PayU payment
 */
export function buildSuccessUrl(baseUrl: string): string {
    return `${baseUrl}/api/payu/webhook`;
}

/**
 * Builds the failure webhook URL
 * Used by frontend to redirect after PayU payment failure
 */
export function buildFailureUrl(baseUrl: string): string {
    return `${baseUrl}/api/payu/webhook`;
}

// ============================================
// WEBHOOK VALIDATION
// ============================================

/**
 * Validates webhook request origin
 * In production, verify IP whitelist or signature
 *
 * @param requestHeaders - Request headers
 * @returns boolean indicating if request is valid
 */
export function validateWebhookOrigin(
    requestHeaders: Record<string, string | string[] | undefined>
): boolean {
    // In production, implement:
    // 1. IP whitelist check (PayU IPs)
    // 2. Request signature validation
    // 3. Timestamp validation (prevent replay attacks)

    // For now, hash verification is the primary security mechanism
    return true;
}

/**
 * Sanitizes webhook parameters for logging
 * Removes sensitive fields before logging
 */
export function sanitizeWebhookParams(
    params: Record<string, unknown>
): Record<string, unknown> {
    const sensitiveFields = ['hash', 'key', 'salt', 'card_num', 'cvv', 'otp'];

    return Object.entries(params).reduce((acc, [key, value]) => {
        if (sensitiveFields.includes(key.toLowerCase())) {
            acc[key] = '[REDACTED]';
        } else {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, unknown>);
}
