// ============================================
// CASHBACK API ROUTE
// GET /api/wallet/:userId/cashback - Get pending and settled cashback
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// MERCHANT SETTLEMENT RULES
// ============================================

const MERCHANT_RULES: Record<string, { type: 'IMMEDIATE' | 'GRACE_PERIOD'; days: number }> = {
    // Food Delivery - Immediate (no cancellations)
    'Zomato': { type: 'IMMEDIATE', days: 0 },
    'Swiggy': { type: 'IMMEDIATE', days: 0 },
    'Dominos': { type: 'IMMEDIATE', days: 0 },
    'Pizza Hut': { type: 'IMMEDIATE', days: 0 },
    'McDonald\'s': { type: 'IMMEDIATE', days: 0 },
    'KFC': { type: 'IMMEDIATE', days: 0 },
    'Uber Eats': { type: 'IMMEDIATE', days: 0 },
    'Faasos': { type: 'IMMEDIATE', days: 0 },
    'Box8': { type: 'IMMEDIATE', days: 0 },

    // E-commerce - 14 day grace period (for returns)
    'Amazon': { type: 'GRACE_PERIOD', days: 14 },
    'Flipkart': { type: 'GRACE_PERIOD', days: 14 },
    'Myntra': { type: 'GRACE_PERIOD', days: 14 },
    'Nykaa': { type: 'GRACE_PERIOD', days: 14 },
    'AJIO': { type: 'GRACE_PERIOD', days: 14 },
    'Tata CLiQ': { type: 'GRACE_PERIOD', days: 14 },
    'Snapdeal': { type: 'GRACE_PERIOD', days: 14 },
    'Meesho': { type: 'GRACE_PERIOD', days: 14 },

    // Travel - 7 day grace period
    'MakeMyTrip': { type: 'GRACE_PERIOD', days: 7 },
    'Goibibo': { type: 'GRACE_PERIOD', days: 7 },
    'Cleartrip': { type: 'GRACE_PERIOD', days: 7 },
    'EaseMyTrip': { type: 'GRACE_PERIOD', days: 7 },

    // Default
    'DEFAULT': { type: 'GRACE_PERIOD', days: 7 },
};

function getSettlementRule(merchantName: string) {
    return MERCHANT_RULES[merchantName] || MERCHANT_RULES['DEFAULT'];
}

function calculateEstimatedSettlement(createdAt: Date, days: number): Date {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + days);
    return date;
}

// ============================================
// GET HANDLER - Fetch Cashback
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        const { userId } = params;

        // Validate userId
        if (!userId) {
            return NextResponse.json(
                { error: { message: 'User ID is required', code: 'MISSING_USER_ID' } },
                { status: 400 }
            );
        }

        // Fetch all CASHBACK_CREDIT entries
        const entries = await prisma.ledgerEntry.findMany({
            where: {
                userId,
                type: 'CASHBACK_CREDIT',
            },
            orderBy: { createdAt: 'desc' },
        });

        // Separate pending and settled
        const pending: Array<{
            id: string;
            amount: number;
            merchantName: string;
            category: string;
            status: 'PENDING';
            createdAt: string;
            estimatedSettlement: string;
            settlementType: 'IMMEDIATE' | 'GRACE_PERIOD';
            gracePeriodDays: number;
        }> = [];

        const settled: Array<{
            id: string;
            amount: number;
            merchantName: string;
            category: string;
            status: 'SETTLED';
            createdAt: string;
            settledAt: string;
            estimatedSettlement: string;
            settlementType: 'IMMEDIATE' | 'GRACE_PERIOD';
            gracePeriodDays: number;
        }> = [];

        for (const entry of entries) {
            // Extract merchant name from description or merchantName field
            const merchantName = entry.merchantName || 'Unknown';

            const rule = getSettlementRule(merchantName);
            const estimatedDate = calculateEstimatedSettlement(entry.createdAt, rule.days);
            const now = new Date();

            const baseEntry = {
                id: entry.id,
                amount: entry.amount / 100, // Convert paisa to rupees
                merchantName,
                category: entry.category || 'Shopping',
                createdAt: entry.createdAt.toISOString(),
                estimatedSettlement: estimatedDate.toISOString(),
                settlementType: rule.type,
                gracePeriodDays: rule.days,
            };

            // Check if cashback is settled
            // For immediate: settled right away
            // For grace period: settled after grace period
            if (rule.type === 'IMMEDIATE' || now >= estimatedDate) {
                settled.push({
                    ...baseEntry,
                    status: 'SETTLED' as const,
                    settledAt: rule.type === 'IMMEDIATE'
                        ? entry.createdAt.toISOString()
                        : estimatedDate.toISOString(),
                });
            } else {
                pending.push({
                    ...baseEntry,
                    status: 'PENDING' as const,
                });
            }
        }

        const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
        const totalSettled = settled.reduce((sum, s) => sum + s.amount, 0);

        return NextResponse.json({
            success: true,
            data: {
                pending,
                settled,
                totalPending,
                totalSettled,
            },
        });

    } catch (error) {
        console.error('Fetch cashback error:', error);
        return NextResponse.json(
            {
                error: {
                    message: 'Failed to fetch cashback data',
                    code: 'FETCH_ERROR'
                }
            },
            { status: 500 }
        );
    }
}
