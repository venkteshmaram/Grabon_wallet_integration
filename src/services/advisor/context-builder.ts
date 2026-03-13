// ============================================
// CONTEXT BUILDER - Builds context for Claude AI
// Step 15: Claude Advisor Service - Production Grade
// ============================================

import { prisma } from '@/lib/prisma';

// ============================================
// TYPES
// ============================================

interface WalletContext {
    availableBalance: number;
    pendingBalance: number;
    lockedBalance: number;
    lifetimeEarned: number;
}

interface MerchantCashback {
    merchantName: string;
    totalCashback: number;
    transactionCount: number;
}

interface FDContext {
    principal: number;
    interestRate: number;
    maturityDate: string;
    daysRemaining: number;
    projectedReturn: number;
}

interface CategorySpending {
    category: string;
    totalSpent: number;
}

interface TopMerchant {
    merchantName: string;
    cashback: number;
    transactionCount: number;
}

interface DayContext {
    dayOfWeek: string;
    isWeekendApproaching: boolean;
    dayOfMonth: number;
    isMonthEnd: boolean;
}

interface PriceSensitivity {
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
}

export interface AdvisorContext {
    wallet: WalletContext;
    cashbackLast30Days: MerchantCashback[];
    activeFDs: FDContext[];
    spendingByCategory: CategorySpending[];
    topMerchants: TopMerchant[];
    dayContext: DayContext;
    accountAge: number;
    transactionCount: number;
    priceSensitivity: PriceSensitivity;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function convertPaisaToRupees(paisa: number | bigint): number {
    return Number(paisa) / 100;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function getDayOfWeek(date: Date): string {
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
}

function calculateDaysRemaining(maturityDate: Date): number {
    const now = new Date();
    const diffTime = maturityDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateDaysSince(createdAt: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================
// CONTEXT BUILDER FUNCTIONS
// ============================================

/**
 * Build wallet context
 */
async function buildWalletContext(userId: string): Promise<WalletContext> {
    const wallet = await prisma.wallet.findUnique({
        where: { userId },
    });

    if (!wallet) {
        return {
            availableBalance: 0,
            pendingBalance: 0,
            lockedBalance: 0,
            lifetimeEarned: 0,
        };
    }

    return {
        availableBalance: convertPaisaToRupees(wallet.availableBalance),
        pendingBalance: convertPaisaToRupees(wallet.pendingBalance),
        lockedBalance: convertPaisaToRupees(wallet.lockedBalance),
        lifetimeEarned: convertPaisaToRupees(wallet.lifetimeEarned),
    };
}

/**
 * Build cashback last 30 days context
 */
async function buildCashbackLast30Days(userId: string): Promise<MerchantCashback[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await prisma.ledgerEntry.findMany({
        where: {
            userId,
            type: 'CASHBACK_CREDIT',
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            merchantName: true,
            amount: true,
        },
    });

    // Group by merchant
    const grouped = new Map<string, { total: number; count: number }>();

    for (const entry of entries) {
        const merchantName = entry.merchantName || 'Unknown';
        const amount = convertPaisaToRupees(entry.amount);

        if (grouped.has(merchantName)) {
            const existing = grouped.get(merchantName)!;
            existing.total += amount;
            existing.count += 1;
        } else {
            grouped.set(merchantName, { total: amount, count: 1 });
        }
    }

    // Convert to array and sort by total cashback
    return Array.from(grouped.entries())
        .map(([merchantName, data]) => ({
            merchantName,
            totalCashback: data.total,
            transactionCount: data.count,
        }))
        .sort((a, b) => b.totalCashback - a.totalCashback);
}

/**
 * Build active FDs context
 */
async function buildActiveFDs(userId: string): Promise<FDContext[]> {
    const fds = await prisma.fDRecord.findMany({
        where: {
            userId,
            status: 'ACTIVE',
        },
    });

    return fds.map((fd: { principal: bigint; interestRate: number; maturityDate: Date; maturityAmount: bigint }) => ({
        principal: convertPaisaToRupees(fd.principal),
        interestRate: fd.interestRate,
        maturityDate: formatDate(fd.maturityDate),
        daysRemaining: calculateDaysRemaining(fd.maturityDate),
        projectedReturn: convertPaisaToRupees(fd.maturityAmount),
    }));
}

/**
 * Build spending by category context
 */
async function buildSpendingByCategory(userId: string): Promise<CategorySpending[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await prisma.ledgerEntry.findMany({
        where: {
            userId,
            type: 'PAYU_SPEND',
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            category: true,
            amount: true,
        },
    });

    // Group by category
    const grouped = new Map<string, number>();

    for (const entry of entries) {
        const category = entry.category || 'Other';
        const amount = convertPaisaToRupees(entry.amount);

        if (grouped.has(category)) {
            grouped.set(category, grouped.get(category)! + amount);
        } else {
            grouped.set(category, amount);
        }
    }

    // Convert to array and sort by total spent
    return Array.from(grouped.entries())
        .map(([category, totalSpent]) => ({
            category,
            totalSpent,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Build top merchants context
 */
async function buildTopMerchants(userId: string): Promise<TopMerchant[]> {
    const currentMonth = new Date();
    currentMonth.setDate(1);

    const entries = await prisma.ledgerEntry.findMany({
        where: {
            userId,
            type: 'CASHBACK_CREDIT',
            createdAt: { gte: currentMonth },
        },
        select: {
            merchantName: true,
            amount: true,
        },
    });

    // Group by merchant
    const grouped = new Map<string, { cashback: number; count: number }>();

    for (const entry of entries) {
        const merchantName = entry.merchantName || 'Unknown';
        const amount = convertPaisaToRupees(entry.amount);

        if (grouped.has(merchantName)) {
            const existing = grouped.get(merchantName)!;
            existing.cashback += amount;
            existing.count += 1;
        } else {
            grouped.set(merchantName, { cashback: amount, count: 1 });
        }
    }

    // Convert to array, sort by cashback, take top 3
    return Array.from(grouped.entries())
        .map(([merchantName, data]) => ({
            merchantName,
            cashback: data.cashback,
            transactionCount: data.count,
        }))
        .sort((a, b) => b.cashback - a.cashback)
        .slice(0, 3);
}

/**
 * Build day context
 */
function buildDayContext(): DayContext {
    const now = new Date();
    const dayOfWeek = getDayOfWeek(now);
    const dayOfMonth = now.getDate();

    // Weekend approaching if Thursday (4) or Friday (5)
    const dayIndex = now.getDay();
    const isWeekendApproaching = dayIndex === 4 || dayIndex === 5;

    // Month end if day >= 25
    const isMonthEnd = dayOfMonth >= 25;

    return {
        dayOfWeek,
        isWeekendApproaching,
        dayOfMonth,
        isMonthEnd,
    };
}

/**
 * Build account age
 */
async function buildAccountAge(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
    });

    if (!user) return 0;

    return calculateDaysSince(user.createdAt);
}

/**
 * Build transaction count
 */
async function buildTransactionCount(userId: string): Promise<number> {
    return await prisma.ledgerEntry.count({
        where: { userId },
    });
}

/**
 * Build price sensitivity
 */
async function buildPriceSensitivity(userId: string): Promise<PriceSensitivity> {
    // Get last 30 days of transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await prisma.ledgerEntry.findMany({
        where: {
            userId,
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            type: true,
        },
    });

    const totalTransactions = entries.length;

    if (totalTransactions === 0) {
        return {
            level: 'MEDIUM',
            reason: 'No transaction history available',
        };
    }

    // Count cashback transactions (approximates coupon usage)
    const cashbackTransactions = entries.filter(
        (e: { type: string }) => e.type === 'CASHBACK_CREDIT'
    ).length;

    const cashbackPercentage = (cashbackTransactions / totalTransactions) * 100;

    if (cashbackPercentage > 70) {
        return {
            level: 'HIGH',
            reason: `Used cashback in ${cashbackPercentage.toFixed(0)}% of transactions`,
        };
    } else if (cashbackPercentage >= 30) {
        return {
            level: 'MEDIUM',
            reason: `Used cashback in ${cashbackPercentage.toFixed(0)}% of transactions`,
        };
    } else {
        return {
            level: 'LOW',
            reason: `Used cashback in ${cashbackPercentage.toFixed(0)}% of transactions`,
        };
    }
}

// ============================================
// MAIN CONTEXT BUILDER
// ============================================

/**
 * Build complete advisor context for Claude AI
 * 
 * @param userId - The user ID to build context for
 * @returns Complete advisor context with all 9 data sections
 */
export async function buildAdvisorContext(userId: string): Promise<AdvisorContext> {
    const [
        wallet,
        cashbackLast30Days,
        activeFDs,
        spendingByCategory,
        topMerchants,
        dayContext,
        accountAge,
        transactionCount,
        priceSensitivity,
    ] = await Promise.all([
        buildWalletContext(userId),
        buildCashbackLast30Days(userId),
        buildActiveFDs(userId),
        buildSpendingByCategory(userId),
        buildTopMerchants(userId),
        Promise.resolve(buildDayContext()), // Sync function
        buildAccountAge(userId),
        buildTransactionCount(userId),
        buildPriceSensitivity(userId),
    ]);

    return {
        wallet,
        cashbackLast30Days,
        activeFDs,
        spendingByCategory,
        topMerchants,
        dayContext,
        accountAge,
        transactionCount,
        priceSensitivity,
    };
}
