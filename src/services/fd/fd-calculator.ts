// ============================================
// FD CALCULATOR - PURE MATH FUNCTIONS
// All calculations in integer paisa, no side effects
// ============================================

import { addDays, differenceInDays } from 'date-fns';
import {
    FD_MIN_AMOUNT_PAISA,
    FD_MIN_TENURE_DAYS,
    FD_MAX_TENURE_DAYS,
    FD_INTEREST_RATE,
    FD_EARLY_BREAK_LOCK_DAYS,
    FD_PREMATURE_PENALTY_PERCENT,
    paisaToRupees,
} from '@/lib/constants';
import {
    FDValidationResult,
    EarlyBreakResult,
    MaturityCalculation,
} from './fd-types';

// ============================================
// MATURITY CALCULATIONS
// ============================================

/**
 * Calculates maturity amount using simple interest formula
 * Formula: Maturity = Principal × (1 + (Rate × TenureDays) / 36500)
 * 
 * Example: ₹1,000 (100000 paisa) for 30 days at 7.5% = 100616 paisa (₹1,006.16)
 */
export function calculateMaturityAmount(
    principalPaisa: number,
    interestRate: number,
    tenureDays: number
): number {
    // Use BigInt for intermediate calculation to prevent overflow
    const principal = BigInt(principalPaisa);
    const rate = BigInt(Math.round(interestRate * 100)); // Store as basis points
    const tenure = BigInt(tenureDays);

    // Calculate: Principal + (Principal × Rate × Tenure) / (365 × 100)
    const interest = (principal * rate * tenure) / BigInt(3650000);
    const maturity = principal + interest;

    return Number(maturity);
}

/**
 * Calculates interest earned (maturity - principal)
 */
export function calculateInterestEarned(
    principalPaisa: number,
    interestRate: number,
    tenureDays: number
): number {
    const maturityAmount = calculateMaturityAmount(
        principalPaisa,
        interestRate,
        tenureDays
    );
    return maturityAmount - principalPaisa;
}

/**
 * Calculates interest accrued from start date to today
 * Used for dashboard display of "interest so far"
 */
export function calculateAccruedInterest(
    principalPaisa: number,
    interestRate: number,
    startDate: Date
): number {
    const daysSinceStart = differenceInDays(new Date(), startDate);

    if (daysSinceStart <= 0) {
        return 0;
    }

    return calculateInterestEarned(
        principalPaisa,
        interestRate,
        daysSinceStart
    );
}

// ============================================
// EARLY BREAK CALCULATIONS
// ============================================

/**
 * Calculates penalty amount for premature withdrawal
 * Formula: Principal × PenaltyPercent / 100
 */
export function calculatePenaltyAmount(
    principalPaisa: number,
    penaltyPercent: number
): number {
    const penalty = (principalPaisa * penaltyPercent) / 100;
    return Math.round(penalty);
}

/**
 * Calculates early break return including accrued interest and penalty
 * Returns the net amount user receives when breaking early
 */
export function calculateEarlyBreakReturn(
    principalPaisa: number,
    interestRate: number,
    startDate: Date,
    penaltyPercent: number = FD_PREMATURE_PENALTY_PERCENT
): EarlyBreakResult {
    const now = new Date();
    const daysElapsed = differenceInDays(now, startDate);
    const lockDaysRemaining = Math.max(0, FD_EARLY_BREAK_LOCK_DAYS - daysElapsed);
    const canBreak = daysElapsed >= FD_EARLY_BREAK_LOCK_DAYS;

    // Calculate accrued interest up to today
    const accruedInterestPaisa = calculateAccruedInterest(
        principalPaisa,
        interestRate,
        startDate
    );

    // Calculate penalty
    const penaltyPaisa = calculatePenaltyAmount(principalPaisa, penaltyPercent);

    // Actual return: Principal + Accrued Interest - Penalty
    const actualReturnPaisa = principalPaisa + accruedInterestPaisa - penaltyPaisa;

    return {
        accruedInterestPaisa,
        accruedInterestRupees: paisaToRupees(accruedInterestPaisa),
        penaltyPaisa,
        penaltyRupees: paisaToRupees(penaltyPaisa),
        actualReturnPaisa,
        actualReturnRupees: paisaToRupees(actualReturnPaisa),
        daysElapsed,
        canBreak,
        lockDaysRemaining,
    };
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validates FD input parameters
 * Checks minimum amount and tenure range
 */
export function validateFDInput(
    principalPaisa: number,
    tenureDays: number
): FDValidationResult {
    // Validate minimum amount
    if (principalPaisa < FD_MIN_AMOUNT_PAISA) {
        return {
            valid: false,
            error: `Minimum investment amount is ₹${FD_MIN_AMOUNT_PAISA / 100}`,
            code: 'BELOW_MINIMUM_AMOUNT',
        };
    }

    // Validate minimum tenure
    if (tenureDays < FD_MIN_TENURE_DAYS) {
        return {
            valid: false,
            error: `Minimum tenure is ${FD_MIN_TENURE_DAYS} days`,
            code: 'INVALID_TENURE',
        };
    }

    // Validate maximum tenure
    if (tenureDays > FD_MAX_TENURE_DAYS) {
        return {
            valid: false,
            error: `Maximum tenure is ${FD_MAX_TENURE_DAYS} days`,
            code: 'INVALID_TENURE',
        };
    }

    return { valid: true };
}

/**
 * Validates amount is positive
 */
export function validateAmount(amountPaisa: number): FDValidationResult {
    if (!amountPaisa || amountPaisa <= 0) {
        return {
            valid: false,
            error: 'Amount must be greater than zero',
            code: 'INVALID_AMOUNT',
        };
    }
    return { valid: true };
}

// ============================================
// DATE CALCULATIONS
// ============================================

/**
 * Calculates maturity date by adding tenure days to start date
 */
export function calculateMaturityDate(
    startDate: Date,
    tenureDays: number
): Date {
    return addDays(startDate, tenureDays);
}

/**
 * Calculates days remaining until maturity
 */
export function calculateDaysRemaining(maturityDate: Date): number {
    const days = differenceInDays(maturityDate, new Date());
    return Math.max(0, days);
}

/**
 * Calculates progress percentage (0-100)
 */
export function calculateProgressPercentage(
    startDate: Date,
    tenureDays: number
): number {
    const daysElapsed = differenceInDays(new Date(), startDate);
    const percentage = (daysElapsed / tenureDays) * 100;
    return Math.min(100, Math.max(0, percentage));
}

// ============================================
// COMPLETE MATURITY CALCULATION
// ============================================

/**
 * Performs complete maturity calculation for FD creation
 */
export function calculateMaturityDetails(
    principalPaisa: number,
    tenureDays: number,
    interestRate: number = FD_INTEREST_RATE
): MaturityCalculation {
    const startDate = new Date();
    const maturityDate = calculateMaturityDate(startDate, tenureDays);
    const maturityAmountPaisa = calculateMaturityAmount(
        principalPaisa,
        interestRate,
        tenureDays
    );
    const interestEarnedPaisa = maturityAmountPaisa - principalPaisa;

    return {
        principalPaisa,
        principalRupees: paisaToRupees(principalPaisa),
        interestRate,
        tenureDays,
        maturityAmountPaisa,
        maturityAmountRupees: paisaToRupees(maturityAmountPaisa),
        interestEarnedPaisa,
        interestEarnedRupees: paisaToRupees(interestEarnedPaisa),
        startDate,
        maturityDate,
    };
}
