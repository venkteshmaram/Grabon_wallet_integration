// ============================================
// NEW USER RULE - Fraud Detection
// Blocks large spends by accounts < 7 days old
// Action: BLOCK (hard block, no OTP)
// ============================================

import {
    FRAUD_NEW_USER_DAYS,
    FRAUD_NEW_USER_AMOUNT_PAISA,
} from '@/lib/constants';
import { FraudContext, NewUserRuleResult, FRAUD_REASONS } from '../fraud-types';

/**
 * Checks if new user is attempting large spend
 * Returns triggered=true with action=BLOCK if:
 * - Account < 7 days old AND
 * - Amount > ₹2,000
 * This is a hard block - transaction is rejected
 */
export function checkNewUserRule(
    context: FraudContext,
    amountPaisa: number
): NewUserRuleResult {
    const { daysSinceCreation } = context;

    // Check if new user
    const isNewUser = daysSinceCreation < FRAUD_NEW_USER_DAYS;

    // Check if large amount
    const isLargeAmount = amountPaisa > FRAUD_NEW_USER_AMOUNT_PAISA;

    // Both conditions must be met
    if (isNewUser && isLargeAmount) {
        return {
            triggered: true,
            reason: FRAUD_REASONS.NEW_USER_LARGE_SPEND,
            action: 'BLOCK',
            daysSinceCreation,
        };
    }

    return { triggered: false, daysSinceCreation };
}
