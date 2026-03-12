// ============================================
// FRAUD ENGINE - Main Orchestrator
// Runs all fraud rules in defined order and returns verdict
// ============================================

import { differenceInDays, subMinutes } from 'date-fns';
import { prisma } from '@/lib/prisma';

// Type for raw ledger entry from Prisma select
interface RawLedgerEntry {
    id: string;
    amount: number;
    merchantId: string | null;
    merchantName: string | null;
    createdAt: Date;
}
import { getWalletBalance } from '@/services/wallet';
import {
    FraudContext,
    FraudCheckResult,
    CheckTransactionInput,
    FraudError,
    FRAUD_ERROR_CODES,
    FRAUD_RULES,
    FraudAction,
} from './fraud-types';
import { checkSpeedRule } from './rules/speed-rule';
import { checkWhitelistRule } from './rules/whitelist-rule';
import { checkAmountRule } from './rules/amount-rule';
import { checkFrequencyRule } from './rules/frequency-rule';
import { checkNewUserRule } from './rules/new-user-rule';
import { checkNightRule } from './rules/night-rule';

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Main fraud check entry point
 * Runs all rules in order and returns final verdict
 *
 * Rule execution order:
 * 1. Whitelist (can override all others)
 * 2. New User (hard block)
 * 3. Frequency (freeze)
 * 4. Speed (OTP)
 * 5. Amount (OTP)
 * 6. Night (OTP)
 */
export async function checkTransaction(
    input: CheckTransactionInput
): Promise<FraudCheckResult> {
    try {
        // Build fraud context (all data needed by rules)
        const context = await buildFraudContext(input.userId);

        // Rule 1: Whitelist Check (can override all others)
        const whitelistResult = checkWhitelistRule(
            context,
            input.merchantId,
            input.amountPaisa
        );
        if (whitelistResult.triggered && whitelistResult.action === 'ALLOW') {
            return {
                isFlagged: false,
                flagReason: null,
                action: 'ALLOW',
                ruleTriggered: FRAUD_RULES.WHITELIST,
                details: { matchCount: whitelistResult.matchCount },
            };
        }

        // Rule 2: New User Check (hard block)
        const newUserResult = checkNewUserRule(context, input.amountPaisa);
        if (newUserResult.triggered && newUserResult.action === 'BLOCK') {
            return {
                isFlagged: true,
                flagReason: newUserResult.reason || null,
                action: 'BLOCK' as FraudAction,
                ruleTriggered: FRAUD_RULES.NEW_USER,
                details: { daysSinceCreation: newUserResult.daysSinceCreation },
            };
        }

        // Rule 3: Frequency Check (freeze)
        const frequencyResult = checkFrequencyRule(context);
        if (frequencyResult.triggered && frequencyResult.action === 'FREEZE') {
            return {
                isFlagged: true,
                flagReason: frequencyResult.reason || null,
                action: 'FREEZE' as FraudAction,
                ruleTriggered: FRAUD_RULES.FREQUENCY,
                details: { transactionCount: frequencyResult.transactionCount },
            };
        }

        // Rule 4: Speed Check (OTP)
        const speedResult = checkSpeedRule(context, input.amountPaisa);
        if (speedResult.triggered) {
            return {
                isFlagged: true,
                flagReason: speedResult.reason || null,
                action: 'REQUIRE_OTP',
                ruleTriggered: FRAUD_RULES.SPEED,
                details: {
                    secondsSinceCredit: speedResult.secondsSinceCredit,
                },
            };
        }

        // Rule 5: Amount Check (OTP)
        const amountResult = checkAmountRule(context, input.amountPaisa);
        if (amountResult.triggered) {
            return {
                isFlagged: true,
                flagReason: amountResult.reason || null,
                action: 'REQUIRE_OTP',
                ruleTriggered: FRAUD_RULES.AMOUNT,
                details: {
                    percentageOfBalance: amountResult.percentageOfBalance,
                },
            };
        }

        // Rule 6: Night Check (OTP)
        const nightResult = checkNightRule(context, input.amountPaisa);
        if (nightResult.triggered) {
            return {
                isFlagged: true,
                flagReason: nightResult.reason || null,
                action: 'REQUIRE_OTP',
                ruleTriggered: FRAUD_RULES.NIGHT,
                details: { currentHour: nightResult.currentHour },
            };
        }

        // No rules triggered - allow transaction
        return {
            isFlagged: false,
            flagReason: null,
            action: 'ALLOW',
            ruleTriggered: null,
        };
    } catch (error) {
        // Fail-safe: require OTP on any error
        console.error('Fraud check error:', error);
        return {
            isFlagged: true,
            flagReason: 'SAFETY_CHECK_FAILED',
            action: 'REQUIRE_OTP',
            ruleTriggered: 'ERROR',
        };
    }
}

// ============================================
// CONTEXT BUILDER
// ============================================

/**
 * Builds fraud context by fetching all required data in batch
 * This minimizes database queries and ensures consistency
 */
async function buildFraudContext(userId: string): Promise<FraudContext> {
    try {
        // Fetch user and balance in parallel
        const [user, balance] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, createdAt: true },
            }),
            getWalletBalance(userId),
        ]);

        if (!user) {
            throw new FraudError('User not found', FRAUD_ERROR_CODES.INVALID_TRANSACTION);
        }

        // Calculate days since creation
        const daysSinceCreation = differenceInDays(new Date(), user.createdAt);

        // Fetch transaction history in parallel
        const fiveMinutesAgo = subMinutes(new Date(), 5);

        const [last5Debits, debitsLast5Minutes, mostRecentCredit] = await Promise.all<[
            RawLedgerEntry[],
            RawLedgerEntry[],
            { id: string; amount: number; createdAt: Date } | null
        ]>([
            // Last 5 debit entries for whitelist check
            prisma.ledgerEntry.findMany({
                where: {
                    userId,
                    direction: 'DEBIT',
                    status: 'SETTLED',
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    amount: true,
                    merchantId: true,
                    merchantName: true,
                    createdAt: true,
                },
            }),

            // Debits in last 5 minutes for frequency check
            prisma.ledgerEntry.findMany({
                where: {
                    userId,
                    direction: 'DEBIT',
                    status: 'SETTLED',
                    createdAt: { gte: fiveMinutesAgo },
                },
                select: {
                    id: true,
                    amount: true,
                    merchantId: true,
                    merchantName: true,
                    createdAt: true,
                },
            }),

            // Most recent credit for speed check
            prisma.ledgerEntry.findFirst({
                where: {
                    userId,
                    direction: 'CREDIT',
                    type: 'CASHBACK_CREDIT',
                    status: 'SETTLED',
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    amount: true,
                    createdAt: true,
                },
            }),
        ]);

        // Get current time in IST (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
        const istTime = new Date(now.getTime() + istOffset);
        const currentHourIST = istTime.getUTCHours();

        return {
            userId,
            accountCreationDate: user.createdAt,
            daysSinceCreation,
            availableBalancePaisa: balance.availablePaisa,
            last5Debits: last5Debits.map((d) => ({
                id: d.id,
                amountPaisa: d.amount,
                merchantId: d.merchantId || '',
                merchantName: d.merchantName || 'Unknown',
                createdAt: d.createdAt,
            })),
            debitsLast5Minutes: debitsLast5Minutes.map((d) => ({
                id: d.id,
                amountPaisa: d.amount,
                merchantId: d.merchantId || '',
                merchantName: d.merchantName || 'Unknown',
                createdAt: d.createdAt,
            })),
            mostRecentCredit: mostRecentCredit
                ? {
                    id: mostRecentCredit.id,
                    amountPaisa: mostRecentCredit.amount,
                    createdAt: mostRecentCredit.createdAt,
                }
                : null,
            currentTime: now,
            currentHourIST,
        };
    } catch (error) {
        if (error instanceof FraudError) throw error;
        throw new FraudError(
            'Failed to build fraud context',
            FRAUD_ERROR_CODES.CONTEXT_BUILD_FAILED
        );
    }
}

// Export context builder for testing
export { buildFraudContext };
