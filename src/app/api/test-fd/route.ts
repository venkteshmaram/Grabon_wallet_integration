import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    createFD,
    getFDById,
    getUserFDs,
    breakFDEarly,
    getFDsDueForMaturity,
    calculateMaturityDetails,
    calculateEarlyBreakReturn,
    validateFDInput,
} from '@/services/fd';

export async function GET() {
    try {
        console.log('Testing FD Service...');

        // Get first user with sufficient balance
        const user = await prisma.user.findFirst({
            include: { wallet: true },
        });

        if (!user || !user.wallet) {
            return NextResponse.json(
                { error: 'No user with wallet found' },
                { status: 404 }
            );
        }

        console.log('Testing with user:', user.name);
        console.log('Available balance:', `₹${user.wallet.availableBalance / 100}`);

        const results: Record<string, unknown> = {
            user: {
                id: user.id,
                name: user.name,
                availableBalance: `₹${user.wallet.availableBalance / 100}`,
            },
        };

        // Test 1: Calculator functions
        console.log('1. Testing calculator functions...');
        const maturityCalc = calculateMaturityDetails(100000, 90); // ₹1,000 for 90 days
        results.calculator = {
            principal: `₹${maturityCalc.principalRupees}`,
            tenureDays: maturityCalc.tenureDays,
            interestRate: `${maturityCalc.interestRate}%`,
            maturityAmount: `₹${maturityCalc.maturityAmountRupees}`,
            interestEarned: `₹${maturityCalc.interestEarnedRupees}`,
            maturityDate: maturityCalc.maturityDate,
        };

        // Test 2: Validation
        console.log('2. Testing validation...');
        const validInput = validateFDInput(100000, 90);
        const invalidAmount = validateFDInput(1000, 90); // Below ₹500 min
        const invalidTenure = validateFDInput(100000, 10); // Below 30 days min
        results.validation = {
            validInput,
            invalidAmount,
            invalidTenure,
        };

        // Test 3: Early break calculation
        console.log('3. Testing early break calculation...');
        const breakCalc = calculateEarlyBreakReturn(100000, 7.5, new Date());
        results.earlyBreak = {
            accruedInterest: `₹${breakCalc.accruedInterestRupees}`,
            penalty: `₹${breakCalc.penaltyRupees}`,
            actualReturn: `₹${breakCalc.actualReturnRupees}`,
            canBreak: breakCalc.canBreak,
            lockDaysRemaining: breakCalc.lockDaysRemaining,
        };

        // Test 4: Create FD (only if sufficient balance)
        if (user.wallet.availableBalance >= 50000) {
            // ₹500 minimum
            console.log('4. Testing createFD...');
            const newFD = await createFD({
                userId: user.id,
                principalPaisa: 50000, // ₹500
                tenureDays: 30,
            });
            results.createFD = {
                id: newFD.id,
                principal: `₹${newFD.principalRupees}`,
                tenureDays: newFD.tenureDays,
                maturityAmount: `₹${newFD.maturityAmountRupees}`,
                interestEarned: `₹${newFD.interestEarnedRupees}`,
                status: newFD.status,
                maturityDate: newFD.maturityDate,
            };

            // Test 5: Get FD by ID
            console.log('5. Testing getFDById...');
            const fetchedFD = await getFDById(newFD.id, user.id);
            results.getFDById = {
                id: fetchedFD.id,
                principal: `₹${fetchedFD.principalRupees}`,
                accruedInterest: `₹${fetchedFD.accruedInterestRupees}`,
                daysRemaining: fetchedFD.daysRemaining,
                progressPercentage: `${fetchedFD.progressPercentage.toFixed(2)}%`,
            };
        } else {
            results.createFD = {
                skipped: true,
                reason: 'Insufficient balance for FD creation test',
            };
        }

        // Test 6: Get user FDs
        console.log('6. Testing getUserFDs...');
        const portfolio = await getUserFDs(user.id);
        results.getUserFDs = {
            totalFDs: portfolio.fds.length,
            totalActiveFDs: portfolio.totalActiveFDs,
            totalPortfolioValue: `₹${portfolio.totalPortfolioValueRupees}`,
            totalLocked: `₹${portfolio.totalLockedRupees}`,
            totalAccruedInterest: `₹${portfolio.totalAccruedInterestRupees}`,
        };

        // Test 7: Get FDs due for maturity (cron job)
        console.log('7. Testing getFDsDueForMaturity...');
        const dueFDs = await getFDsDueForMaturity();
        results.getFDsDueForMaturity = {
            count: dueFDs.length,
            fds: dueFDs.map((fd) => ({
                id: fd.id.substring(0, 8) + '...',
                principal: `₹${fd.principalPaisa / 100}`,
                maturityDate: fd.maturityDate,
            })),
        };

        return NextResponse.json({
            success: true,
            tests: results,
        });
    } catch (error) {
        console.error('FD Test failed:', error);
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
