// ============================================
// SPEED RULE - Fraud Detection
// Flags transactions within 90 seconds of receiving cashback
// ============================================

import { FRAUD_SPEED_THRESHOLD_SECONDS } from '@/lib/constants';
import { FraudContext, SpeedRuleResult, FRAUD_REASONS } from '../fraud-types';

/**
 * Checks if transaction occurs within threshold seconds of most recent credit
 * Returns triggered=true if speed violation detected
 */
export function checkSpeedRule(
    context: FraudContext,
    _amountPaisa: number
): SpeedRuleResult {
    // If no recent credit, speed rule cannot trigger
    if (!context.mostRecentCredit) {
        return { triggered: false };
    }

    const now = context.currentTime.getTime();
    const creditTime = new Date(context.mostRecentCredit.createdAt).getTime();
    const secondsSinceCredit = Math.floor((now - creditTime) / 1000);

    // Check if within threshold
    if (secondsSinceCredit < FRAUD_SPEED_THRESHOLD_SECONDS) {
        return {
            triggered: true,
            reason: FRAUD_REASONS.SPEED_VIOLATION,
            secondsSinceCredit,
        };
    }

    return { triggered: false };
}
