// ============================================
// WALLET SERVICE - TEST EXAMPLES
// Usage examples for testing the wallet service
// Run with: npx ts-node src/services/wallet/test-wallet-service.ts
// ============================================

import {
    getWalletBalance,
    creditCashback,
    settlePendingEntry,
    spendBalance,
    lockForFD,
    unlockFromFD,
    holdForFraud,
    releaseFromFraudHold,
    getLedgerEntries,
    getWalletAnalytics,
    getPendingEntriesOlderThan,
} from './index';

// Test user ID (use one from your seeded data)
const TEST_USER_ID = 'your-test-user-id-here';
const TEST_MERCHANT_ID = 'test-merchant-123';

/**
 * Example 1: Get wallet balance
 */
async function testGetBalance() {
    console.log('=== Test 1: Get Wallet Balance ===');
    try {
        const balance = await getWalletBalance(TEST_USER_ID);
        console.log('Balance:', {
            available: `₹${balance.availableRupees}`,
            pending: `₹${balance.pendingRupees}`,
            locked: `₹${balance.lockedRupees}`,
            lifetimeEarned: `₹${balance.lifetimeEarnedRupees}`,
        });
        return balance;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 2: Credit cashback (creates pending entry)
 */
async function testCreditCashback() {
    console.log('\n=== Test 2: Credit Cashback ===');
    try {
        // Amount in paisa: ₹50.00 = 5000 paisa
        const entry = await creditCashback({
            userId: TEST_USER_ID,
            amountPaisa: 5000,
            merchantId: TEST_MERCHANT_ID,
            merchantName: 'Test Store',
            category: 'Shopping',
            description: 'Test cashback',
        });
        console.log('Cashback credited:', {
            id: entry.id,
            amount: `₹${entry.amountRupees}`,
            status: entry.status,
        });
        return entry;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 3: Settle pending entry
 */
async function testSettlePending(ledgerEntryId: string) {
    console.log('\n=== Test 3: Settle Pending Entry ===');
    try {
        const entry = await settlePendingEntry(ledgerEntryId);
        console.log('Entry settled:', {
            id: entry.id,
            status: entry.status,
            settledAt: entry.settledAt,
        });
        return entry;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 4: Spend balance (PayU transaction)
 */
async function testSpendBalance() {
    console.log('\n=== Test 4: Spend Balance ===');
    try {
        // Amount in paisa: ₹25.00 = 2500 paisa
        const entry = await spendBalance({
            userId: TEST_USER_ID,
            amountPaisa: 2500,
            merchantId: TEST_MERCHANT_ID,
            merchantName: 'Test Store',
            description: 'Test purchase',
        });
        console.log('Balance spent:', {
            id: entry.id,
            amount: `₹${entry.amountRupees}`,
            balanceAfter: `₹${entry.balanceAfterRupees}`,
        });
        return entry;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 5: Lock funds for FD
 */
async function testLockForFD() {
    console.log('\n=== Test 5: Lock for FD ===');
    try {
        // Amount in paisa: ₹1000.00 = 100000 paisa
        const entry = await lockForFD({
            userId: TEST_USER_ID,
            amountPaisa: 100000,
            fdId: 'test-fd-123',
        });
        console.log('Funds locked:', {
            id: entry.id,
            amount: `₹${entry.amountRupees}`,
            fdId: entry.description,
        });
        return entry;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 6: Unlock funds from FD (with interest)
 */
async function testUnlockFromFD() {
    console.log('\n=== Test 6: Unlock from FD ===');
    try {
        // Principal: ₹1000, Interest: ₹50
        const result = await unlockFromFD({
            userId: TEST_USER_ID,
            principalPaisa: 100000,
            interestPaisa: 5000,
            fdId: 'test-fd-123',
        });
        console.log('Funds unlocked:', {
            principal: `₹${result.unlockEntry.amountRupees}`,
            interest: `₹${result.interestEntry.amountRupees}`,
            totalReturned: `₹${result.unlockEntry.amountRupees + result.interestEntry.amountRupees}`,
        });
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 7: Hold for fraud review
 */
async function testHoldForFraud(ledgerEntryId: string) {
    console.log('\n=== Test 7: Hold for Fraud ===');
    try {
        const entry = await holdForFraud(
            TEST_USER_ID,
            ledgerEntryId,
            'SPEED_VIOLATION'
        );
        console.log('Entry held:', {
            id: entry.id,
            isFlagged: entry.isFlagged,
            flagReason: entry.flagReason,
            status: entry.status,
        });
        return entry;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 8: Release from fraud hold
 */
async function testReleaseFromFraud(ledgerEntryId: string) {
    console.log('\n=== Test 8: Release from Fraud Hold ===');
    try {
        const entry = await releaseFromFraudHold(TEST_USER_ID, ledgerEntryId);
        console.log('Entry released:', {
            id: entry.id,
            status: entry.status,
            isFlagged: entry.isFlagged,
        });
        return entry;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 9: Get ledger entries with filters
 */
async function testGetLedgerEntries() {
    console.log('\n=== Test 9: Get Ledger Entries ===');
    try {
        const result = await getLedgerEntries(TEST_USER_ID, {
            type: 'ALL',
            limit: 10,
            offset: 0,
        });
        console.log('Ledger entries:', {
            total: result.total,
            returned: result.entries.length,
            hasMore: result.hasMore,
            firstEntry: result.entries[0] ? {
                type: result.entries[0].type,
                amount: `₹${result.entries[0].amountRupees}`,
                status: result.entries[0].status,
            } : null,
        });
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 10: Get wallet analytics
 */
async function testGetAnalytics() {
    console.log('\n=== Test 10: Get Wallet Analytics ===');
    try {
        const analytics = await getWalletAnalytics(TEST_USER_ID);
        console.log('Analytics:', {
            categoryBreakdown: analytics.categoryBreakdown.length,
            monthlyTrend: analytics.monthlyTrend.length,
            topMerchants: analytics.topMerchants.length,
            savingsRate: `${analytics.savingsRate.percentage}%`,
        });
        return analytics;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Example 11: Get pending entries for cron job
 */
async function testGetPendingEntries() {
    console.log('\n=== Test 11: Get Pending Entries for Cron ===');
    try {
        // Get entries older than 24 hours (default)
        const entries = await getPendingEntriesOlderThan(24);
        console.log('Pending entries:', {
            count: entries.length,
            entries: entries.map((e) => ({
                id: e.id.substring(0, 8) + '...',
                amount: `₹${e.amountPaisa / 100}`,
                hoursOld: Math.round(
                    (Date.now() - e.createdAt.getTime()) / (1000 * 60 * 60)
                ),
            })),
        });
        return entries;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
    console.log('Starting Wallet Service Tests...\n');

    try {
        // Test 1: Get initial balance
        await testGetBalance();

        // Test 2: Credit cashback
        const creditEntry = await testCreditCashback();

        // Test 9: Get ledger to see the entry
        await testGetLedgerEntries();

        // Test 3: Settle the pending entry
        await testSettlePending(creditEntry.id);

        // Test 4: Spend some balance
        await testSpendBalance();

        // Test 5: Lock funds for FD
        await testLockForFD();

        // Test 6: Unlock funds from FD
        await testUnlockFromFD();

        // Test 10: Get analytics
        await testGetAnalytics();

        // Test 11: Get pending entries (for cron)
        await testGetPendingEntries();

        console.log('\n=== All Tests Completed Successfully ===');
    } catch (error) {
        console.error('\n=== Test Suite Failed ===', error);
        process.exit(1);
    }
}

// Export test functions for individual use
export {
    testGetBalance,
    testCreditCashback,
    testSettlePending,
    testSpendBalance,
    testLockForFD,
    testUnlockFromFD,
    testHoldForFraud,
    testReleaseFromFraud,
    testGetLedgerEntries,
    testGetAnalytics,
    testGetPendingEntries,
    runAllTests,
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}
