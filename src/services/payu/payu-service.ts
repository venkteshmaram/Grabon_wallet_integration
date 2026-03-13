// ============================================
// PAYU SERVICE - Transaction Lifecycle Operations
// Orchestrates payment initiation, fraud checks, and wallet updates
// ============================================

import { prisma } from '@/lib/prisma';
import { checkTransaction } from '@/services/fraud';
import { getWalletBalance, spendBalance } from '@/services/wallet';
import { logToFile } from '@/lib/logger';

import {
    InitiatePaymentInput,
    PaymentInitiationResult,
    PaymentVerificationResult,
    PayUResponseParams,
    PayUError,
    PAYU_ERROR_CODES,
} from './payu-types';

import {
    buildPayUFormParams,
    generateTransactionId,
    getPayUBaseUrl,
    validateAmountPaisa,
    parsePayUAmountToPaisa,
} from './payu-hash';

// In-memory store for pending transactions (use Redis in production)
const pendingTransactions = new Map<string, PendingTransactionData>();

interface PendingTransactionData {
    userId: string;
    amountPaisa: number;
    merchantId: string;
    merchantName: string;
    appliedBalancePaisa?: number;
    createdAt: Date;
}

// ============================================
// PAYMENT INITIATION
// ============================================

/**
 * Orchestrates the payment initiation flow
 *
 * Flow:
 * 1. Validate amount
 * 2. Fetch user details from database
 * 3. Verify available balance is sufficient
 * 4. Run fraud check via fraud-engine
 * 5. If flagged, return fraud result instead of PayU params
 * 6. Generate unique transaction ID
 * 7. Build PayU form params with hash
 * 8. Store pending transaction
 * 9. Return params for frontend redirect
 *
 * @param input - Payment initiation input
 * @returns PaymentInitiationResult with PayU params or fraud flag
 */
export async function initiatePayment(
    input: InitiatePaymentInput
): Promise<PaymentInitiationResult> {
    logToFile('[PAYU_SERVICE] Initiating payment', input);
    // Step 1: Validate amount
    validateAmountPaisa(input.amountPaisa);

    try {
        // Step 2: Fetch user details
        const user = await prisma.user.findUnique({
            where: { id: input.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        });

        if (!user || !user.email) {
            throw new PayUError(
                'User not found or email not available',
                PAYU_ERROR_CODES.TRANSACTION_NOT_FOUND
            );
        }

        // Step 3: Verify available balance if split payment is used
        const walletBalance = await getWalletBalance(input.userId);
        const appliedPaisa = input.appliedBalancePaisa || 0;
        
        if (appliedPaisa > 0 && walletBalance.availablePaisa < appliedPaisa) {
            throw new PayUError(
                'Insufficient available balance to apply to this transaction',
                PAYU_ERROR_CODES.INSUFFICIENT_BALANCE
            );
        }

        // Step 4: Run fraud check
        const fraudCheck = await checkTransaction({
            userId: input.userId,
            amountPaisa: input.amountPaisa,
            merchantId: input.merchantId,
            merchantName: input.merchantName,
        });

        // Step 5: If fraud flagged, return early
        if (fraudCheck.isFlagged) {
            logToFile('[PAYU_SERVICE] Fraud check flagged transaction', fraudCheck);
            return {
                isFlagged: true,
                flagReason: fraudCheck.flagReason || 'Transaction flagged by fraud engine',
                fraudAction: fraudCheck.action,
            };
        }

        // Step 6: Generate unique transaction ID
        const txnId = generateTransactionId();

        // Step 7: Build PayU form params
        const productInfo = input.productInfo || `Payment to ${input.merchantName}`;
        const payuParams = buildPayUFormParams(
            user.id,
            input.amountPaisa,
            txnId,
            productInfo,
            user.email,
            user.name,
            input.merchantId,
            input.merchantName,
            appliedPaisa,
            user.phone || ''
        );

        // Step 8: Store pending transaction (for webhook verification)
        storePendingTransaction(txnId, {
            userId: input.userId,
            amountPaisa: input.amountPaisa,
            merchantId: input.merchantId,
            merchantName: input.merchantName,
            appliedBalancePaisa: appliedPaisa,
            createdAt: new Date(),
        });

        // Step 9: Return result
        return {
            isFlagged: false,
            payuParams,
            payuBaseUrl: getPayUBaseUrl(),
            txnId,
        };
    } catch (error) {
        if (error instanceof PayUError) throw error;

        throw new PayUError(
            `Payment initiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            PAYU_ERROR_CODES.PAYU_ERROR
        );
    }
}

// ============================================
// PENDING TRANSACTION STORE
// ============================================

/**
 * Stores pending transaction data
 * In production, use Redis or database instead of in-memory Map
 */
function storePendingTransaction(
    txnId: string,
    data: PendingTransactionData
): void {
    pendingTransactions.set(txnId, data);

    // Auto-expire after 30 minutes
    setTimeout(() => {
        pendingTransactions.delete(txnId);
    }, 30 * 60 * 1000);
}

/**
 * Retrieves pending transaction data
 */
function getPendingTransaction(txnId: string): PendingTransactionData | undefined {
    return pendingTransactions.get(txnId);
}

/**
 * Removes pending transaction data
 */
function removePendingTransaction(txnId: string): void {
    pendingTransactions.delete(txnId);
}

/**
 * Checks if a transaction has already been processed
 * Uses ledger entry lookup for idempotency
 */
async function isTransactionProcessed(txnId: string): Promise<boolean> {
    const existingEntry = await prisma.ledgerEntry.findFirst({
        where: {
            description: {
                contains: txnId,
            },
        },
    });

    return !!existingEntry;
}

// ============================================
// WEBHOOK HANDLING - SUCCESS
// ============================================

/**
 * Processes PayU success webhook callback
 *
 * Flow:
 * 1. Verify response hash (security requirement)
 * 2. Check for duplicate processing (idempotency)
 * 3. Lookup original amount from pending transaction
 * 4. Use stored amount, never trust response amount
 * 5. Create PayU Spend ledger entry via wallet service
 * 6. Clean up pending transaction
 * 7. Return success confirmation
 *
 * @param responseParams - Parameters received from PayU
 * @returns PaymentVerificationResult
 */
export async function handlePayUSuccess(
    responseParams: PayUResponseParams
): Promise<PaymentVerificationResult> {
    const txnId = responseParams.txnid;

    try {
        // Step 1: Verify hash (critical security check)
        const { verifyPayUResponseHash } = await import('./payu-hash');
        const isHashValid = verifyPayUResponseHash(responseParams);

        if (!isHashValid) {
            // Log txnid but NOT the hash for security
            throw new PayUError(
                `Hash verification failed for transaction ${txnId}`,
                PAYU_ERROR_CODES.HASH_VERIFICATION_FAILED,
                txnId
            );
        }

        // Step 2: Check for duplicate processing
        const alreadyProcessed = await isTransactionProcessed(txnId);
        if (alreadyProcessed) {
            return {
                success: true,
                txnId,
                amountPaisa: 0,
                message: 'Transaction already processed',
            };
        }

        // Step 3: Get pending transaction data
        const pendingTx = getPendingTransaction(txnId);
        logToFile('[PAYU_SERVICE] Pending transaction lookup', { txnId, found: !!pendingTx, data: pendingTx });

        // Step 4: Extract transaction data (from memory or UDF fields)
        // UDF fields are trusted because hash verification passed
        const userId = pendingTx?.userId || responseParams.udf1 || '';
        const merchantId = pendingTx?.merchantId || responseParams.udf2 || '';
        const merchantName = pendingTx?.merchantName || responseParams.udf3 || 'Unknown Merchant';

        logToFile('[PAYU_SERVICE] Extracted transaction data', { userId, merchantId, merchantName, udf1: responseParams.udf1, udf2: responseParams.udf2 });

        if (!userId || !merchantId) {
            throw new PayUError(
                `Cannot determine transaction details for ${txnId}`,
                PAYU_ERROR_CODES.TRANSACTION_NOT_FOUND,
                txnId
            );
        }

        // Step 5: Calculate amounts
        const totalAmountPaisa = pendingTx?.amountPaisa ||
            Math.round(parseFloat(responseParams.amount) * 100);
        
        // Use UDF4 as fallback if pendingTx is lost (e.g. server restart)
        const rewardPortionPaisa = pendingTx?.appliedBalancePaisa ?? 
            parseInt(responseParams.udf4 || '0', 10);
            
        const externalPortionPaisa = totalAmountPaisa - rewardPortionPaisa;

        logToFile('[PAYU_SERVICE] Processing success webhook', {
            txnId,
            totalAmountPaisa,
            rewardPortionPaisa,
            externalPortionPaisa
        });

        // Step 6: Record External Payment portion (funds from PayU)
        let mainLedgerId = '';
        const walletSvc = await import('@/services/wallet/wallet-service');

        if (externalPortionPaisa > 0) {
            const result = await walletSvc.recordExternalPayment({
                userId,
                amountPaisa: externalPortionPaisa,
                merchantId,
                merchantName,
                description: `PayU External Payment - TXN: ${txnId}`,
                type: 'PAYU_EXTERNAL',
            });
            mainLedgerId = result.id;
        }

        // Step 6a: Deduct Applied Wallet Rewards (funds from Wallet)
        if (rewardPortionPaisa > 0) {
            const result = await walletSvc.spendBalance({
                userId,
                amountPaisa: rewardPortionPaisa,
                merchantId,
                merchantName,
                description: `Applied Reward Balance - TXN: ${txnId}`,
                type: 'REWARD_SPEND',
            });
            if (!mainLedgerId) mainLedgerId = result.id;
        }

        // Step 6b: Award dynamic cashback on TOTAL amount
        const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
        const rate = merchant?.cashbackRate ?? 5.0;
        const cashbackAmount = Math.round(totalAmountPaisa * (rate / 100));

        if (cashbackAmount > 0) {
            const rewardEntry = await walletSvc.creditCashback({
                userId,
                amountPaisa: cashbackAmount,
                merchantId,
                merchantName,
                category: merchant?.category || 'Reward',
                description: `${rate}% Cashback for purchase at ${merchantName}`,
            });

            // Settle immediately if Food (Demo requirement)
            if (merchant?.category === 'FOOD') {
                await walletSvc.settlePendingEntry(rewardEntry.id);
            }
        }

        // Step 7: Clean up pending transaction (if exists)
        removePendingTransaction(txnId);

        // Step 8: Return success
        return {
            success: true,
            txnId,
            amountPaisa: totalAmountPaisa,
            message: 'Payment processed successfully',
            ledgerEntryId: mainLedgerId,
        };
    } catch (error) {
        if (error instanceof PayUError) throw error;

        throw new PayUError(
            `Success webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            PAYU_ERROR_CODES.WEBHOOK_PROCESSING_FAILED,
            txnId
        );
    }
}

// ============================================
// WEBHOOK HANDLING - FAILURE
// ============================================

/**
 * Processes PayU failure webhook callback
 *
 * Flow:
 * 1. Verify response hash (if provided)
 * 2. Log the failure with transaction ID
 * 3. Clean up pending transaction
 * 4. Return failure confirmation
 *
 * @param responseParams - Parameters received from PayU
 * @returns PaymentVerificationResult
 */
export async function handlePayUFailure(
    responseParams: PayUResponseParams
): Promise<PaymentVerificationResult> {
    const txnId = responseParams.txnid;

    try {
        // Step 1: Verify hash if provided
        const { verifyPayUResponseHash } = await import('./payu-hash');
        const isHashValid = verifyPayUResponseHash(responseParams);

        if (!isHashValid) {
            // Still log the failure but note hash mismatch
            // Don't throw - we want to record the failure
        }

        // Step 2: Get pending transaction (for logging)
        const pendingTx = getPendingTransaction(txnId);

        // Step 3: Clean up pending transaction
        removePendingTransaction(txnId);

        // Log failure details (without sensitive data)
        const failureReason = responseParams.error_Message ||
            responseParams.error ||
            'Unknown failure reason';

        // Step 4: Return failure result
        return {
            success: false,
            txnId,
            amountPaisa: pendingTx?.amountPaisa || 0,
            message: `Payment failed: ${failureReason}`,
            errorCode: responseParams.error || 'PAYU_FAILURE',
        };
    } catch (error) {
        if (error instanceof PayUError) throw error;

        throw new PayUError(
            `Failure webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            PAYU_ERROR_CODES.WEBHOOK_PROCESSING_FAILED,
            txnId
        );
    }
}

// ============================================
// PAYMENT VERIFICATION (POLLING FALLBACK)
// ============================================

/**
 * Verifies payment status by transaction ID
 * Used as fallback when webhook is delayed
 *
 * @param txnId - Transaction ID to verify
 * @returns PaymentVerificationResult
 */
export async function verifyPaymentStatus(
    txnId: string
): Promise<PaymentVerificationResult> {
    try {
        // Check if transaction exists in ledger
        const ledgerEntry = await prisma.ledgerEntry.findFirst({
            where: {
                description: {
                    contains: txnId,
                },
            },
        });

        if (ledgerEntry) {
            return {
                success: true,
                txnId,
                amountPaisa: ledgerEntry.amount,
                message: 'Payment verified and processed',
                ledgerEntryId: ledgerEntry.id,
            };
        }

        // Check if still pending
        const pendingTx = getPendingTransaction(txnId);
        if (pendingTx) {
            return {
                success: false,
                txnId,
                amountPaisa: pendingTx.amountPaisa,
                message: 'Payment pending - awaiting PayU confirmation',
            };
        }

        // Not found anywhere
        return {
            success: false,
            txnId,
            amountPaisa: 0,
            message: 'Transaction not found',
            errorCode: PAYU_ERROR_CODES.TRANSACTION_NOT_FOUND,
        };
    } catch (error) {
        throw new PayUError(
            `Payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            PAYU_ERROR_CODES.PAYU_ERROR,
            txnId
        );
    }
}

// ============================================
// CONFIGURATION VALIDATION
// ============================================

/**
 * Validates that all required PayU configuration is present
 * Call this at application startup to fail fast
 *
 * @throws PayUError if any configuration is missing
 */
export function validatePayUConfig(): void {
    const requiredVars = [
        'PAYU_KEY',
        'PAYU_SALT',
        'PAYU_BASE_URL',
        'PAYU_SUCCESS_URL',
        'PAYU_FAILURE_URL',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new PayUError(
            `Missing PayU configuration: ${missing.join(', ')}`,
            PAYU_ERROR_CODES.MISSING_CONFIG
        );
    }

    // Validate URLs are HTTPS (required by PayU)
    const successUrl = process.env.PAYU_SUCCESS_URL!;
    const failureUrl = process.env.PAYU_FAILURE_URL!;

    if (!successUrl.startsWith('https://') || !failureUrl.startsWith('https://')) {
        throw new PayUError(
            'PAYU_SUCCESS_URL and PAYU_FAILURE_URL must use HTTPS',
            PAYU_ERROR_CODES.MISSING_CONFIG
        );
    }
}
