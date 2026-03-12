import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    getWalletBalance,
    creditCashback,
    getLedgerEntries,
    getWalletAnalytics,
} from '@/services/wallet';

export async function GET() {
    try {
        console.log('Testing Wallet Service...');

        // Get first user from database
        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json(
                { error: 'No users found. Run seed first.' },
                { status: 404 }
            );
        }

        console.log('Testing with user:', user.name, user.id);

        // Test 1: Get Balance
        console.log('1. Testing getWalletBalance...');
        const balance = await getWalletBalance(user.id);

        // Test 2: Credit Cashback
        console.log('2. Testing creditCashback...');
        const creditEntry = await creditCashback({
            userId: user.id,
            amountPaisa: 5000, // ₹50.00
            merchantId: 'test-merchant-001',
            merchantName: 'Test Store',
            category: 'Shopping',
            description: 'Test cashback credit',
        });

        // Test 3: Get Ledger
        console.log('3. Testing getLedgerEntries...');
        const ledger = await getLedgerEntries(user.id, { limit: 5 });

        // Test 4: Get Analytics
        console.log('4. Testing getWalletAnalytics...');
        const analytics = await getWalletAnalytics(user.id);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            tests: {
                balance: {
                    available: `₹${balance.availableRupees}`,
                    pending: `₹${balance.pendingRupees}`,
                    locked: `₹${balance.lockedRupees}`,
                    lifetimeEarned: `₹${balance.lifetimeEarnedRupees}`,
                },
                creditEntry: {
                    id: creditEntry.id,
                    amount: `₹${creditEntry.amountRupees}`,
                    status: creditEntry.status,
                },
                ledger: {
                    totalEntries: ledger.total,
                    returned: ledger.entries.length,
                },
                analytics: {
                    categoryCount: analytics.categoryBreakdown.length,
                    monthlyTrendCount: analytics.monthlyTrend.length,
                    topMerchantCount: analytics.topMerchants.length,
                    savingsRate: `${analytics.savingsRate.percentage}%`,
                },
            },
        });
    } catch (error) {
        console.error('Test failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                code: (error as { code?: string }).code,
            },
            { status: 500 }
        );
    }
}
