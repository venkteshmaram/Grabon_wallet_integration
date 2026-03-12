// ============================================
// FD CALCULATOR TESTS
// Pure math function tests with known inputs/outputs
// ============================================

import {
    calculateMaturityAmount,
    calculateInterestEarned,
    calculatePenaltyAmount,
    validateFDInput,
} from '@/services/fd/fd-calculator';

describe('FD Calculator', () => {
    describe('calculateMaturityAmount', () => {
        it('should calculate standard maturity correctly (₹1,000 for 30 days)', () => {
            // Input: ₹1,000 = 100000 paisa, rate = 7.5%, tenure = 30 days
            // Expected: ₹1,006.16 = 100616 paisa
            // Formula: 100000 × (1 + (7.5 × 30) / 36500) = 100616.44 → floor to 100616
            const result = calculateMaturityAmount(100000, 7.5, 30);
            expect(result).toBe(100616);
        });

        it('should calculate minimum investment maturity (₹500 for 30 days)', () => {
            // Input: ₹500 = 50000 paisa, rate = 7.5%, tenure = 30 days
            // Expected: ₹503.08 = 50308 paisa
            const result = calculateMaturityAmount(50000, 7.5, 30);
            expect(result).toBe(50308);
        });

        it('should calculate maximum tenure maturity (₹1,000 for 365 days)', () => {
            // Input: ₹1,000 = 100000 paisa, rate = 7.5%, tenure = 365 days
            // Expected: ₹1,075.00 = 107500 paisa
            // Formula: 100000 × (1 + (7.5 × 365) / 36500) = 107500
            const result = calculateMaturityAmount(100000, 7.5, 365);
            expect(result).toBe(107500);
        });

        it('should handle larger principal amounts correctly', () => {
            // Input: ₹10,000 = 1000000 paisa, rate = 7.5%, tenure = 30 days
            const result = calculateMaturityAmount(1000000, 7.5, 30);
            // Expected: 1000000 + (1000000 × 7.5 × 30 / 36500) = 1000000 + 6164 = 1006164
            expect(result).toBe(1006164);
        });
    });

    describe('calculateInterestEarned', () => {
        it('should return interest equal to maturity minus principal', () => {
            const principal = 100000;
            const rate = 7.5;
            const tenure = 30;

            const maturityAmount = calculateMaturityAmount(principal, rate, tenure);
            const interestEarned = calculateInterestEarned(principal, rate, tenure);

            // Assert: Interest = Maturity - Principal
            expect(interestEarned).toBe(maturityAmount - principal);
            expect(interestEarned).toBe(616); // 100616 - 100000
        });

        it('should calculate correct interest for minimum investment', () => {
            const interestEarned = calculateInterestEarned(50000, 7.5, 30);
            expect(interestEarned).toBe(308); // 50308 - 50000
        });

        it('should calculate correct interest for maximum tenure', () => {
            const interestEarned = calculateInterestEarned(100000, 7.5, 365);
            expect(interestEarned).toBe(7500); // 107500 - 100000
        });
    });

    describe('calculatePenaltyAmount', () => {
        it('should calculate 1% penalty correctly', () => {
            // Input: ₹1,000 = 100000 paisa, penalty = 1%
            // Expected: ₹10 = 1000 paisa
            const result = calculatePenaltyAmount(100000, 1);
            expect(result).toBe(1000);
        });

        it('should calculate 2% penalty correctly', () => {
            // Input: ₹1,000 = 100000 paisa, penalty = 2%
            // Expected: ₹20 = 2000 paisa
            const result = calculatePenaltyAmount(100000, 2);
            expect(result).toBe(2000);
        });

        it('should handle minimum investment penalty', () => {
            // Input: ₹500 = 50000 paisa, penalty = 1%
            // Expected: ₹5 = 500 paisa
            const result = calculatePenaltyAmount(50000, 1);
            expect(result).toBe(500);
        });
    });

    describe('validateFDInput', () => {
        it('should reject principal below minimum (₹499)', () => {
            // Input: ₹499.99 = 49999 paisa (below ₹500 minimum)
            const result = validateFDInput(49999, 30);
            expect(result.valid).toBe(false);
            expect(result.code).toBe('BELOW_MINIMUM_AMOUNT');
        });

        it('should accept principal at minimum (₹500)', () => {
            // Input: ₹500 = 50000 paisa (exact minimum)
            const result = validateFDInput(50000, 30);
            expect(result.valid).toBe(true);
        });

        it('should reject tenure below minimum (29 days)', () => {
            // Input: 29 days (below 30 day minimum)
            const result = validateFDInput(100000, 29);
            expect(result.valid).toBe(false);
            expect(result.code).toBe('INVALID_TENURE');
        });

        it('should accept tenure at minimum (30 days)', () => {
            // Input: 30 days (exact minimum)
            const result = validateFDInput(100000, 30);
            expect(result.valid).toBe(true);
        });

        it('should reject tenure above maximum (366 days)', () => {
            // Input: 366 days (above 365 day maximum)
            const result = validateFDInput(100000, 366);
            expect(result.valid).toBe(false);
            expect(result.code).toBe('INVALID_TENURE');
        });

        it('should accept tenure at maximum (365 days)', () => {
            // Input: 365 days (exact maximum)
            const result = validateFDInput(100000, 365);
            expect(result.valid).toBe(true);
        });

        it('should accept valid input within all ranges', () => {
            // Input: ₹1,000 = 100000 paisa, 90 days
            const result = validateFDInput(100000, 90);
            expect(result.valid).toBe(true);
        });
    });
});
