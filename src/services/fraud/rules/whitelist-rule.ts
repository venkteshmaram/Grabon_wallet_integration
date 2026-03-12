// ============================================
// WHITELIST RULE - Fraud Detection Override
// Protects regular merchants (e.g., Priya's Zomato purchases)
// Counts matching transactions in last 5 debits
// ============================================

import {
    FRAUD_WHITELIST_MATCH_COUNT,
    FRAUD_WHITELIST_HISTORY_WINDOW,
} from '@/lib/constants';
import { FraudContext, WhitelistRuleResult, FRAUD_REASONS } from '../fraud-types';

/**
 * Checks if user has established pattern with this merchant
 * Returns triggered=true with action=ALLOW if 3+ matches in last 5 debits
 * This overrides all other fraud rules
 */
export function checkWhitelistRule(
    context: FraudContext,
    merchantId: string,
    amountPaisa: number
): WhitelistRuleResult {
    // Need minimum history for whitelist to work
    if (context.last5Debits.length < FRAUD_WHITELIST_MATCH_COUNT) {
        return { triggered: false };
    }

    // Count matches (same merchant + amount within ±10%)
    let matchCount = 0;

    for (const debit of context.last5Debits) {
        const merchantMatch = debit.merchantId === merchantId;
        const amountMatch = isAmountSimilar(debit.amountPaisa, amountPaisa);

        if (merchantMatch && amountMatch) {
            matchCount++;
        }
    }

    // If 3+ matches, whitelist the transaction
    if (matchCount >= FRAUD_WHITELIST_MATCH_COUNT) {
        return {
            triggered: true,
            reason: FRAUD_REASONS.WHITELIST_MATCH,
            action: 'ALLOW',
            matchCount,
        };
    }

    return { triggered: false, matchCount };
}

/**
 * Checks if two amounts are within ±10% of each other
 */
function isAmountSimilar(amount1: number, amount2: number): boolean {
    if (amount2 === 0) return false;

    const difference = Math.abs(amount1 - amount2);
    const percentageDiff = (difference / amount2) * 100;

    return percentageDiff <= 10;
}
