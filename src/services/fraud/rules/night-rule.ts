// ============================================
// NIGHT RULE - Fraud Detection
// Flags high-value transactions during quiet hours (1am-4am IST)
// ============================================

import {
    FRAUD_NIGHT_HOUR_START,
    FRAUD_NIGHT_HOUR_END,
    FRAUD_NIGHT_AMOUNT_PAISA,
} from '@/lib/constants';
import { FraudContext, NightRuleResult, FRAUD_REASONS } from '../fraud-types';

/**
 * Checks for high-value transactions during night hours
 * Returns triggered=true if:
 * - Current hour is between 1am-4am IST AND
 * - Amount > ₹2,000
 */
export function checkNightRule(
    context: FraudContext,
    amountPaisa: number
): NightRuleResult {
    const { currentHourIST } = context;

    // Check if night hours (1am - 4am IST)
    const isNightTime =
        currentHourIST >= FRAUD_NIGHT_HOUR_START &&
        currentHourIST < FRAUD_NIGHT_HOUR_END;

    // Check if high value
    const isHighValue = amountPaisa > FRAUD_NIGHT_AMOUNT_PAISA;

    // Both conditions must be met
    if (isNightTime && isHighValue) {
        return {
            triggered: true,
            reason: FRAUD_REASONS.NIGHT_HIGH_VALUE,
            currentHour: currentHourIST,
        };
    }

    return { triggered: false, currentHour: currentHourIST };
}
