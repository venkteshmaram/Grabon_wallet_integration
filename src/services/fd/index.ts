// ============================================
// FD SERVICE - PUBLIC API
// Export all FD calculator and service operations
// ============================================

// Types
export type {
    FDRecordResponse,
    FDPortfolioSummary,
    CreateFDInput,
    FDValidationResult,
    EarlyBreakResult,
    MaturityCalculation,
    FDDueForMaturity,
} from './fd-types';

// Constants and Classes
export { FD_ERROR_CODES, FDError } from './fd-types';

// Calculator functions (pure math)
export {
    calculateMaturityAmount,
    calculateInterestEarned,
    calculateAccruedInterest,
    calculatePenaltyAmount,
    calculateEarlyBreakReturn,
    validateFDInput,
    validateAmount,
    calculateMaturityDate,
    calculateDaysRemaining,
    calculateProgressPercentage,
    calculateMaturityDetails,
} from './fd-calculator';

// Service functions (database operations)
export {
    createFD,
    getFDById,
    getUserFDs,
    breakFDEarly,
    matureFD,
    getFDsDueForMaturity,
} from './fd-service';
