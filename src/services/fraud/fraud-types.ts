// ============================================
// FRAUD ENGINE - TYPESCRIPT TYPES
// Type definitions for fraud detection operations
// ============================================

// ============================================
// FRAUD ACTION TYPES
// ============================================

export type FraudAction = 'ALLOW' | 'REQUIRE_OTP' | 'BLOCK' | 'FREEZE';

// ============================================
// FRAUD CONTEXT
// ============================================

export interface FraudContext {
    userId: string;
    accountCreationDate: Date;
    daysSinceCreation: number;
    availableBalancePaisa: number;
    last5Debits: DebitEntry[];
    debitsLast5Minutes: DebitEntry[];
    mostRecentCredit: CreditEntry | null;
    currentTime: Date;
    currentHourIST: number;
    lastVerifiedOtpAt: Date | null;
}

export interface DebitEntry {
    id: string;
    amountPaisa: number;
    merchantId: string;
    merchantName: string;
    createdAt: Date;
}

export interface CreditEntry {
    id: string;
    amountPaisa: number;
    createdAt: Date;
}

// ============================================
// RULE RESULT TYPES
// ============================================

export interface RuleResult {
    triggered: boolean;
    reason?: string;
    action?: FraudAction;
}

export interface SpeedRuleResult extends RuleResult {
    secondsSinceCredit?: number;
}

export interface WhitelistRuleResult extends RuleResult {
    matchCount?: number;
}

export interface AmountRuleResult extends RuleResult {
    percentageOfBalance?: number;
}

export interface FrequencyRuleResult extends RuleResult {
    transactionCount?: number;
}

export interface NewUserRuleResult extends RuleResult {
    daysSinceCreation?: number;
}

export interface NightRuleResult extends RuleResult {
    currentHour?: number;
}

// ============================================
// FRAUD CHECK RESULT
// ============================================

export interface FraudCheckResult {
    isFlagged: boolean;
    flagReason: string | null;
    action: FraudAction;
    ruleTriggered: string | null;
    details?: Record<string, unknown>;
}

// ============================================
// TRANSACTION INPUT
// ============================================

export interface CheckTransactionInput {
    userId: string;
    amountPaisa: number;
    merchantId: string;
    merchantName: string;
}

// ============================================
// ERROR TYPES
// ============================================

export const FRAUD_ERROR_CODES = {
    CONTEXT_BUILD_FAILED: 'CONTEXT_BUILD_FAILED',
    INVALID_TRANSACTION: 'INVALID_TRANSACTION',
} as const;

export type FraudErrorCode = keyof typeof FRAUD_ERROR_CODES;

export class FraudError extends Error {
    code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'FraudError';
        this.code = code;
    }
}

// ============================================
// RULE NAMES
// ============================================

export const FRAUD_RULES = {
    WHITELIST: 'WHITELIST',
    NEW_USER: 'NEW_USER',
    FREQUENCY: 'FREQUENCY',
    SPEED: 'SPEED',
    AMOUNT: 'AMOUNT',
    NIGHT: 'NIGHT',
} as const;

export type FraudRuleName = keyof typeof FRAUD_RULES;

// ============================================
// RULE REASONS
// ============================================

export const FRAUD_REASONS = {
    SPEED_VIOLATION: 'SPEED_VIOLATION',
    LARGE_AMOUNT_RATIO: 'LARGE_AMOUNT_RATIO',
    HIGH_FREQUENCY: 'HIGH_FREQUENCY',
    NEW_USER_LARGE_SPEND: 'NEW_USER_LARGE_SPEND',
    NIGHT_HIGH_VALUE: 'NIGHT_HIGH_VALUE',
    WHITELIST_MATCH: 'WHITELIST_MATCH',
} as const;

export type FraudReason = keyof typeof FRAUD_REASONS;
