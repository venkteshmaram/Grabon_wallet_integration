// ============================================
// FRAUD WHITELIST RULE TESTS
// Tests for whitelist rule and fraud engine interactions
// ============================================

import { checkWhitelistRule } from '@/services/fraud/rules/whitelist-rule';
import { FraudContext } from '@/services/fraud/fraud-types';

// Helper to create a mock fraud context
function createMockContext(
    last5Debits: Array<{ merchantId: string; amountPaisa: number }>
): FraudContext {
    return {
        userId: 'test-user-id',
        accountCreationDate: new Date('2024-01-01'),
        daysSinceCreation: 30,
        last5Debits: last5Debits.map((debit, index) => ({
            id: `debit-${index}`,
            merchantId: debit.merchantId,
            merchantName: debit.merchantId,
            amountPaisa: debit.amountPaisa,
            createdAt: new Date(`2024-01-${10 + index}`),
        })),
        debitsLast5Minutes: [],
        mostRecentCredit: null,
        availableBalancePaisa: 100000, // ₹1,000
        currentTime: new Date(),
        currentHourIST: 12,
    };
}

describe('Fraud Whitelist Rule', () => {
    describe('Test 1: Priya passes whitelist check', () => {
        it('should return ALLOW when 3+ Zomato transactions within ±10% amount', () => {
            // Setup: Last 5 debits all at Zomato with amounts around ₹200
            const context = createMockContext([
                { merchantId: 'zomato', amountPaisa: 20000 }, // ₹200
                { merchantId: 'zomato', amountPaisa: 19800 }, // ₹198 (within 10%)
                { merchantId: 'zomato', amountPaisa: 20500 }, // ₹205 (within 10%)
                { merchantId: 'zomato', amountPaisa: 19900 }, // ₹199 (within 10%)
                { merchantId: 'zomato', amountPaisa: 20100 }, // ₹201 (within 10%)
            ]);

            // Call with ₹195 (within 10% of ₹200)
            const result = checkWhitelistRule(context, 'zomato', 19500);

            expect(result.triggered).toBe(true);
            expect(result.action).toBe('ALLOW');
            expect(result.matchCount).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Test 2: Vikram fails whitelist check (different merchants)', () => {
        it('should return triggered=false when merchants are different', () => {
            // Setup: Last 5 debits at 5 different merchants
            const context = createMockContext([
                { merchantId: 'merchant1', amountPaisa: 20000 },
                { merchantId: 'merchant2', amountPaisa: 20000 },
                { merchantId: 'merchant3', amountPaisa: 20000 },
                { merchantId: 'merchant4', amountPaisa: 20000 },
                { merchantId: 'merchant5', amountPaisa: 20000 },
            ]);

            const result = checkWhitelistRule(context, 'zomato', 20000);

            expect(result.triggered).toBe(false);
        });
    });

    describe('Test 3: Whitelist requires 3 matches minimum', () => {
        it('should return triggered=false when only 2 merchant matches', () => {
            // Setup: Only 2 of last 5 debits match Zomato
            const context = createMockContext([
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'other1', amountPaisa: 20000 },
                { merchantId: 'other2', amountPaisa: 20000 },
                { merchantId: 'other3', amountPaisa: 20000 },
            ]);

            const result = checkWhitelistRule(context, 'zomato', 20000);

            expect(result.triggered).toBe(false);
            expect(result.matchCount).toBe(2);
        });

        it('should return ALLOW when exactly 3 merchant matches', () => {
            // Setup: Exactly 3 of last 5 debits match Zomato
            const context = createMockContext([
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'other1', amountPaisa: 20000 },
                { merchantId: 'other2', amountPaisa: 20000 },
            ]);

            const result = checkWhitelistRule(context, 'zomato', 20000);

            expect(result.triggered).toBe(true);
            expect(result.action).toBe('ALLOW');
            expect(result.matchCount).toBe(3);
        });
    });

    describe('Test 4: Amount similarity check (±10%)', () => {
        it('should count match when amount is within 10% range', () => {
            const context = createMockContext([
                { merchantId: 'zomato', amountPaisa: 20000 }, // ₹200
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'zomato', amountPaisa: 20000 },
            ]);

            // ₹195 is within 10% of ₹200 (difference is ₹5 = 2.5%)
            const result = checkWhitelistRule(context, 'zomato', 19500);
            expect(result.triggered).toBe(true);
            expect(result.matchCount).toBeGreaterThanOrEqual(3);
        });

        it('should not count match when amount differs by more than 10%', () => {
            const context = createMockContext([
                { merchantId: 'zomato', amountPaisa: 20000 }, // ₹200
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'zomato', amountPaisa: 20000 },
            ]);

            // ₹170 differs by ₹30 = 15% (more than 10% threshold)
            const result = checkWhitelistRule(context, 'zomato', 17000);
            // Since amount doesn't match, it won't trigger whitelist
            expect(result.triggered).toBe(false);
        });

        it('should handle amounts within 10% boundary', () => {
            const context = createMockContext([
                { merchantId: 'zomato', amountPaisa: 20000 }, // ₹200
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'zomato', amountPaisa: 20000 },
            ]);

            // ₹190 differs by ₹10 = 5% (within 10%)
            const result = checkWhitelistRule(context, 'zomato', 19000);
            expect(result.triggered).toBe(true);
            expect(result.matchCount).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Test 5: Insufficient history', () => {
        it('should return triggered=false when fewer than 3 debits exist', () => {
            const context = createMockContext([
                { merchantId: 'zomato', amountPaisa: 20000 },
                { merchantId: 'zomato', amountPaisa: 20000 },
            ]);

            const result = checkWhitelistRule(context, 'zomato', 20000);

            expect(result.triggered).toBe(false);
        });

        it('should return triggered=false when no debits exist', () => {
            const context = createMockContext([]);

            const result = checkWhitelistRule(context, 'zomato', 20000);

            expect(result.triggered).toBe(false);
        });
    });
});
