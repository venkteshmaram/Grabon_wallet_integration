// ============================================
// AMOUNT RULE - Fraud Detection
// Flags transactions > 80% of available balance
// ============================================

import { FRAUD_AMOUNT_THRESHOLD_PERCENT } from '@/lib/constants';
import { FraudContext, AmountRuleResult, FRAUD_REASONS } from '../fraud-types';

/**
 * Checks if transaction amount exceeds threshold % of available balance
 * Returns triggered=true if amount is too large relative to balance
 */
export function checkAmountRule(
    context: FraudContext,
    amountPaisa: number
): AmountRuleResult {
    // If balance is zero, any spend triggers this rule
    if (context.availableBalancePaisa === 0) {
        return {
            triggered: true,
            reason: FRAUD_REASONS.LARGE_AMOUNT_RATIO,
            percentageOfBalance: 100,
        };
    }

    // Calculate percentage of available balance
    const percentageOfBalance =
        (amountPaisa / context.availableBalancePaisa) * 100;

    // Check if exceeds threshold
    if (percentageOfBalance > FRAUD_AMOUNT_THRESHOLD_PERCENT) {
        return {
            triggered: true,
            reason: FRAUD_REASONS.LARGE_AMOUNT_RATIO,
            percentageOfBalance: Math.round(percentageOfBalance * 100) / 100,
        };
    }

    return { triggered: false, percentageOfBalance };
}
