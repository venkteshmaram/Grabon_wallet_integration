// ============================================
// FREQUENCY RULE - Fraud Detection
// Flags 3+ transactions within 5 minutes
// Action: FREEZE (most severe)
// ============================================

import { FRAUD_FREQUENCY_THRESHOLD } from '@/lib/constants';
import { FraudContext, FrequencyRuleResult, FRAUD_REASONS } from '../fraud-types';

/**
 * Checks for high frequency transactions in recent window
 * Returns triggered=true with action=FREEZE if threshold exceeded
 * This is the most severe rule - locks the account
 */
export function checkFrequencyRule(
    context: FraudContext
): FrequencyRuleResult {
    const transactionCount = context.debitsLast5Minutes.length;

    // Check if exceeds threshold
    if (transactionCount >= FRAUD_FREQUENCY_THRESHOLD) {
        return {
            triggered: true,
            reason: FRAUD_REASONS.HIGH_FREQUENCY,
            action: 'FREEZE',
            transactionCount,
        };
    }

    return { triggered: false, transactionCount };
}
