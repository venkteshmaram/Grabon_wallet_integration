import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    checkTransaction,
    checkSpeedRule,
    checkWhitelistRule,
    checkAmountRule,
    checkFrequencyRule,
    checkNewUserRule,
    checkNightRule,
    buildFraudContext,
} from '@/services/fraud';

// GET /api/test-fraud - Run fraud tests
export async function GET(request: NextRequest) {
    try {
        console.log('Testing Fraud Engine...');

        // Get test users
        const users = await prisma.user.findMany({
            take: 3,
            include: { wallet: true },
        });

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'No users found' },
                { status: 404 }
            );
        }

        const results: Record<string, unknown> = {};

        // Test with first user (likely Priya - power user)
        const testUser = users[0];
        console.log('Testing with user:', testUser.name);

        // Test 1: Build fraud context
        console.log('1. Testing buildFraudContext...');
        const context = await buildFraudContext(testUser.id);
        results.context = {
            userId: context.userId,
            daysSinceCreation: context.daysSinceCreation,
            availableBalance: `₹${context.availableBalancePaisa / 100}`,
            last5DebitsCount: context.last5Debits.length,
            debitsLast5MinutesCount: context.debitsLast5Minutes.length,
            hasRecentCredit: !!context.mostRecentCredit,
            currentHourIST: context.currentHourIST,
        };

        // Test 2: Individual rules with test data
        console.log('2. Testing individual rules...');

        // Test amount rule (> 80% of balance)
        const largeAmount = Math.floor(context.availableBalancePaisa * 0.9); // 90% of balance
        const amountResult = checkAmountRule(context, largeAmount);
        results.amountRule = {
            testedAmount: `₹${largeAmount / 100}`,
            triggered: amountResult.triggered,
            percentageOfBalance: amountResult.percentageOfBalance,
        };

        // Test whitelist rule
        const whitelistResult = checkWhitelistRule(
            context,
            'zomato-merchant-id',
            50000 // ₹500
        );
        results.whitelistRule = {
            triggered: whitelistResult.triggered,
            action: whitelistResult.action,
            matchCount: whitelistResult.matchCount,
        };

        // Test speed rule
        const speedResult = checkSpeedRule(context, 10000);
        results.speedRule = {
            triggered: speedResult.triggered,
            secondsSinceCredit: speedResult.secondsSinceCredit,
        };

        // Test frequency rule
        const frequencyResult = checkFrequencyRule(context);
        results.frequencyRule = {
            triggered: frequencyResult.triggered,
            transactionCount: frequencyResult.transactionCount,
        };

        // Test new user rule
        const newUserResult = checkNewUserRule(context, 250000); // ₹2,500
        results.newUserRule = {
            triggered: newUserResult.triggered,
            action: newUserResult.action,
            daysSinceCreation: newUserResult.daysSinceCreation,
        };

        // Test night rule
        const nightResult = checkNightRule(context, 250000); // ₹2,500
        results.nightRule = {
            triggered: nightResult.triggered,
            currentHour: nightResult.currentHour,
        };

        // Test 3: Full transaction check - Normal transaction
        console.log('3. Testing normal transaction...');
        const normalTx = await checkTransaction({
            userId: testUser.id,
            amountPaisa: 1000, // ₹10 - small amount
            merchantId: 'test-merchant',
            merchantName: 'Test Store',
        });
        results.normalTransaction = {
            isFlagged: normalTx.isFlagged,
            action: normalTx.action,
            ruleTriggered: normalTx.ruleTriggered,
        };

        // Test 4: Full transaction check - Large amount
        console.log('4. Testing large amount transaction...');
        const largeTx = await checkTransaction({
            userId: testUser.id,
            amountPaisa: largeAmount,
            merchantId: 'test-merchant',
            merchantName: 'Test Store',
        });
        results.largeAmountTransaction = {
            isFlagged: largeTx.isFlagged,
            action: largeTx.action,
            ruleTriggered: largeTx.ruleTriggered,
            flagReason: largeTx.flagReason,
            details: largeTx.details,
        };

        // Test 5: Test with different users if available
        if (users.length > 1) {
            console.log('5. Testing with different user profiles...');
            const userTests = [];

            for (const user of users.slice(0, 3)) {
                const ctx = await buildFraudContext(user.id);
                const txResult = await checkTransaction({
                    userId: user.id,
                    amountPaisa: 50000, // ₹500
                    merchantId: 'test-merchant',
                    merchantName: 'Test Store',
                });

                userTests.push({
                    name: user.name,
                    accountAge: ctx.daysSinceCreation,
                    availableBalance: `₹${ctx.availableBalancePaisa / 100}`,
                    fraudResult: txResult.action,
                    rule: txResult.ruleTriggered,
                });
            }
            results.userComparisons = userTests;
        }

        return NextResponse.json({
            success: true,
            tests: results,
        });
    } catch (error) {
        console.error('Fraud test failed:', error);
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

// POST /api/test-fraud - Test specific scenario
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, amountPaisa, merchantId, merchantName } = body;

        if (!userId || !amountPaisa || !merchantId) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, amountPaisa, merchantId' },
                { status: 400 }
            );
        }

        const result = await checkTransaction({
            userId,
            amountPaisa,
            merchantId,
            merchantName: merchantName || 'Test Merchant',
        });

        return NextResponse.json({
            success: true,
            result: {
                isFlagged: result.isFlagged,
                action: result.action,
                flagReason: result.flagReason,
                ruleTriggered: result.ruleTriggered,
                details: result.details,
            },
        });
    } catch (error) {
        console.error('Fraud check error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
