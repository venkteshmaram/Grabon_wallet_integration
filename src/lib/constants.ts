// ============================================
// GRABCASH WALLET - NAMED CONSTANTS
// All thresholds and configuration values
// ============================================

// ============================================
// CASHBACK CONFIGURATION
// ============================================

/**
 * Hours before pending cashback settles to available balance
 * Default: 24 hours
 */
export const CASHBACK_SETTLEMENT_HOURS = parseInt(
    process.env.CASHBACK_SETTLEMENT_HOURS ?? '24',
    10
);

// ============================================
// FIXED DEPOSIT CONFIGURATION
// ============================================

/**
 * Minimum FD investment amount in paisa (₹500 = 50000 paisa)
 */
export const FD_MIN_AMOUNT_PAISA = parseInt(
    process.env.FD_MIN_AMOUNT ?? '500',
    10
) * 100;

/**
 * Minimum FD tenure in days
 * Default: 30 days
 */
export const FD_MIN_TENURE_DAYS = parseInt(
    process.env.FD_MIN_TENURE_DAYS ?? '30',
    10
);

/**
 * Maximum FD tenure in days
 * Default: 365 days
 */
export const FD_MAX_TENURE_DAYS = parseInt(
    process.env.FD_MAX_TENURE_DAYS ?? '365',
    10
);

/**
 * FD interest rate per annum (percentage)
 * Default: 7.5%
 */
export const FD_INTEREST_RATE = parseFloat(
    process.env.FD_INTEREST_RATE ?? '7.5'
);

/**
 * Days before an FD can be broken early (lock period)
 * Default: 30 days (Per ASSIGNMENT.MD Line 30)
 */
export const FD_EARLY_BREAK_LOCK_DAYS = parseInt(
    process.env.FD_EARLY_BREAK_LOCK_DAYS ?? '30',
    10
);

/**
 * Penalty percentage for premature FD break
 * Default: 1%
 */
export const FD_PREMATURE_PENALTY_PERCENT = parseFloat(
    process.env.FD_PREMATURE_PENALTY_PERCENT ?? '1'
);

// ============================================
// FRAUD DETECTION CONFIGURATION
// ============================================

/**
 * Speed threshold in seconds - spending within this time of credit triggers flag
 * Default: 90 seconds
 */
export const FRAUD_SPEED_THRESHOLD_SECONDS = parseInt(
    process.env.FRAUD_SPEED_THRESHOLD_SECONDS ?? '90',
    10
);

/**
 * Amount threshold percentage - spending above this % of available balance triggers flag
 * Default: 80%
 */
export const FRAUD_AMOUNT_THRESHOLD_PERCENT = parseInt(
    process.env.FRAUD_AMOUNT_THRESHOLD_PERCENT ?? '80',
    10
);

/**
 * Time window for frequency check in minutes
 * Default: 5 minutes
 */
export const FRAUD_FREQUENCY_WINDOW_MINUTES = parseInt(
    process.env.FRAUD_FREQUENCY_WINDOW_MINUTES ?? '5',
    10
);

/**
 * Number of transactions in frequency window to trigger freeze
 * Default: 3
 */
export const FRAUD_FREQUENCY_THRESHOLD = parseInt(
    process.env.FRAUD_FREQUENCY_THRESHOLD ?? '3',
    10
);

/**
 * Days since account creation to be considered a new user
 * Default: 7 days
 */
export const FRAUD_NEW_USER_DAYS = parseInt(
    process.env.FRAUD_NEW_USER_DAYS ?? '7',
    10
);

/**
 * Maximum spend amount for new users in paisa (₹2000 = 200000 paisa)
 */
export const FRAUD_NEW_USER_AMOUNT_PAISA = parseInt(
    process.env.FRAUD_NEW_USER_AMOUNT ?? '2000',
    10
) * 100;

/**
 * Start hour for night-time restriction (24-hour format, IST)
 * Default: 1 (1 AM)
 */
export const FRAUD_NIGHT_HOUR_START = parseInt(
    process.env.FRAUD_NIGHT_HOUR_START ?? '1',
    10
);

/**
 * End hour for night-time restriction (24-hour format, IST)
 * Default: 4 (4 AM)
 */
export const FRAUD_NIGHT_HOUR_END = parseInt(
    process.env.FRAUD_NIGHT_HOUR_END ?? '4',
    10
);

/**
 * Maximum spend amount during night hours in paisa (₹2000 = 200000 paisa)
 */
export const FRAUD_NIGHT_AMOUNT_PAISA = parseInt(
    process.env.FRAUD_NIGHT_AMOUNT ?? '2000',
    10
) * 100;

/**
 * Number of matching transactions required for whitelist override
 * Hardcoded: 3
 */
export const FRAUD_WHITELIST_MATCH_COUNT = 3;

/**
 * Number of historical debits to check for whitelist pattern
 * Hardcoded: 5
 */
export const FRAUD_WHITELIST_HISTORY_WINDOW = 5;

// ============================================
// OTP CONFIGURATION
// ============================================

/**
 * OTP expiry time in minutes
 * Hardcoded: 5
 */
export const OTP_EXPIRY_MINUTES = 5;

/**
 * Maximum failed OTP attempts before account freeze
 * Hardcoded: 3
 */
export const OTP_MAX_ATTEMPTS = 3;

// ============================================
// CURRENCY CONVERSION UTILITIES
// ============================================

/**
 * Convert paisa to rupees for display (paisa / 100)
 */
export function paisaToRupees(paisa: number): number {
    return paisa / 100;
}

/**
 * Convert rupees to paisa for storage (rupees * 100)
 */
export function rupeesToPaisa(rupees: number): number {
    return Math.round(rupees * 100);
}

/**
 * Format paisa as currency string (₹X,XXX.XX)
 */
export function formatCurrency(paisa: number): string {
    const rupees = paisaToRupees(paisa);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(rupees);
}

// ============================================
// ERROR CODES
// ============================================

export const ERROR_CODES = {
    WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    ALREADY_SETTLED: 'ALREADY_SETTLED',
    LEDGER_ENTRY_NOT_FOUND: 'LEDGER_ENTRY_NOT_FOUND',
    INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
    FD_NOT_ACTIVE: 'FD_NOT_ACTIVE',
    FD_LOCK_PERIOD_ACTIVE: 'FD_LOCK_PERIOD_ACTIVE',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// ============================================
// PAYU ERROR CODES
// ============================================

export const PAYU_ERROR_CODES = {
    HASH_VERIFICATION_FAILED: 'HASH_VERIFICATION_FAILED',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    MISSING_CONFIG: 'MISSING_PAYU_CONFIG',
    TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
    DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    FRAUD_BLOCKED: 'FRAUD_BLOCKED',
    PAYU_ERROR: 'PAYU_ERROR',
    WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
} as const;

export type PayuErrorCode = keyof typeof PAYU_ERROR_CODES;
