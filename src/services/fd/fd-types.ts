// ============================================
// FD SERVICE - TYPESCRIPT TYPES
// Type definitions for Fixed Deposit operations
// ============================================

// ============================================
// FD STATUS TYPES
// ============================================

export type FDStatus = 'ACTIVE' | 'MATURED' | 'BROKEN';

// ============================================
// FD RECORD TYPES
// ============================================

/**
 * Complete FD record with computed fields
 */
export interface FDRecordResponse {
    id: string;
    userId: string;
    principalPaisa: number;
    principalRupees: number;
    interestRate: number;
    tenureDays: number;
    maturityAmountPaisa: number;
    maturityAmountRupees: number;
    interestEarnedPaisa: number;
    interestEarnedRupees: number;
    startDate: Date;
    maturityDate: Date;
    status: FDStatus;
    // Live computed fields (not stored)
    accruedInterestPaisa: number;
    accruedInterestRupees: number;
    daysRemaining: number;
    progressPercentage: number;
    // Early break fields (populated if broken)
    brokenAt: Date | null;
    penaltyAmountPaisa: number | null;
    penaltyAmountRupees: number | null;
    actualReturnPaisa: number | null;
    actualReturnRupees: number | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * FD summary for portfolio view
 */
export interface FDPortfolioSummary {
    fds: FDRecordResponse[];
    totalActiveFDs: number;
    totalPortfolioValuePaisa: number;
    totalPortfolioValueRupees: number;
    totalLockedPaisa: number;
    totalLockedRupees: number;
    totalAccruedInterestPaisa: number;
    totalAccruedInterestRupees: number;
}

// ============================================
// FD INPUT TYPES
// ============================================

/**
 * Input for creating a new FD
 */
export interface CreateFDInput {
    userId: string;
    principalPaisa: number;
    tenureDays: number;
}

/**
 * Validation result for FD input
 */
export interface FDValidationResult {
    valid: boolean;
    error?: string;
    code?: string;
}

// ============================================
// FD CALCULATION TYPES
// ============================================

/**
 * Early break calculation result
 */
export interface EarlyBreakResult {
    accruedInterestPaisa: number;
    accruedInterestRupees: number;
    penaltyPaisa: number;
    penaltyRupees: number;
    actualReturnPaisa: number;
    actualReturnRupees: number;
    daysElapsed: number;
    canBreak: boolean;
    lockDaysRemaining: number;
}

/**
 * FD maturity calculation
 */
export interface MaturityCalculation {
    principalPaisa: number;
    principalRupees: number;
    interestRate: number;
    tenureDays: number;
    maturityAmountPaisa: number;
    maturityAmountRupees: number;
    interestEarnedPaisa: number;
    interestEarnedRupees: number;
    maturityDate: Date;
}

// ============================================
// ERROR TYPES
// ============================================

export const FD_ERROR_CODES = {
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    BELOW_MINIMUM_AMOUNT: 'BELOW_MINIMUM_AMOUNT',
    INVALID_TENURE: 'INVALID_TENURE',
    FD_NOT_FOUND: 'FD_NOT_FOUND',
    FD_NOT_ACTIVE: 'FD_NOT_ACTIVE',
    FD_LOCK_PERIOD_ACTIVE: 'FD_LOCK_PERIOD_ACTIVE',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
} as const;

export type FDErrorCode = keyof typeof FD_ERROR_CODES;

/**
 * Custom error class for FD operations
 */
export class FDError extends Error {
    code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'FDError';
        this.code = code;
    }
}

// ============================================
// CRON JOB TYPES
// ============================================

/**
 * FD due for maturity (used by cron job)
 */
export interface FDDueForMaturity {
    id: string;
    userId: string;
    principalPaisa: number;
    interestEarnedPaisa: number;
    maturityDate: Date;
}
