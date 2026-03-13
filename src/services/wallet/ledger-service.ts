// ============================================
// LEDGER SERVICE - QUERY AND ANALYTICS
// Ledger queries, filters, and analytics operations
// ============================================

import { prisma } from '@/lib/prisma';
import {
    CASHBACK_SETTLEMENT_HOURS,
    paisaToRupees,
} from '@/lib/constants';
import {
    LedgerFilters,
    LedgerEntryResponse,
    LedgerType,
    LedgerDirection,
    LedgerStatus,
    WalletAnalytics,
    CategoryBreakdown,
    MonthlyTrend,
    TopMerchant,
    PendingEntry,
    WalletError,
} from './wallet-types';
import { ERROR_CODES } from '@/lib/constants';

// ============================================
// LEDGER QUERY OPERATIONS
// ============================================

/**
 * Gets paginated ledger entries with filters
 */
export async function getLedgerEntries(
    userId: string,
    filters: LedgerFilters = {}
): Promise<{
    entries: LedgerEntryResponse[];
    total: number;
    hasMore: boolean;
}> {
    try {
        const where = buildWhereClause(userId, filters);
        const limit = filters.limit ?? 20;
        const offset = filters.offset ?? 0;

        const [entries, total] = await Promise.all([
            prisma.ledgerEntry.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            prisma.ledgerEntry.count({ where }),
        ]);

        return {
            entries: entries.map(mapLedgerEntryToResponse),
            total,
            hasMore: offset + entries.length < total,
        };
    } catch (error) {
        throw new WalletError(
            'Failed to fetch ledger entries',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

/**
 * Builds Prisma where clause from filters
 */
function buildWhereClause(
    userId: string,
    filters: LedgerFilters
): Record<string, unknown> {
    const where: Record<string, unknown> = { userId };

    // Type filter
    if (filters.type && filters.type !== 'ALL') {
        switch (filters.type) {
            case 'CREDITS':
                where.direction = 'CREDIT';
                break;
            case 'SPENDS':
                where.type = 'PAYU_SPEND';
                break;
            case 'FD':
                where.type = { in: ['FD_LOCK', 'FD_UNLOCK', 'FD_INTEREST'] };
                break;
            case 'FLAGGED':
                where.isFlagged = true;
                break;
            default:
                where.type = filters.type as string;
        }
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status as string;
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
        const dateFilter: Record<string, Date> = {};
        if (filters.startDate) {
            dateFilter.gte = filters.startDate;
        }
        if (filters.endDate) {
            dateFilter.lte = filters.endDate;
        }
        where.createdAt = dateFilter;
    }

    return where;
}

// ============================================
// ANALYTICS OPERATIONS
// ============================================

/**
 * Computes wallet analytics for dashboard
 */
export async function getWalletAnalytics(
    userId: string
): Promise<WalletAnalytics> {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [categoryBreakdown, monthlyTrend, topMerchants, savingsRate] =
            await Promise.all([
                getCategoryBreakdown(userId, thirtyDaysAgo),
                getMonthlyTrend(userId, sixMonthsAgo),
                getTopMerchants(userId, thirtyDaysAgo),
                getSavingsRate(userId),
            ]);

        return {
            categoryBreakdown,
            monthlyTrend,
            topMerchants,
            savingsRate,
        };
    } catch (error) {
        throw new WalletError(
            'Failed to fetch wallet analytics',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

/**
 * Gets category breakdown for last 30 days
 */
async function getCategoryBreakdown(
    userId: string,
    since: Date
): Promise<CategoryBreakdown[]> {
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            userId,
            direction: 'CREDIT',
            status: 'SETTLED',
            category: { not: null },
            createdAt: { gte: since },
        },
        select: {
            category: true,
            amount: true,
        },
    });

    const categoryMap = new Map<string, number>();
    let total = 0;

    for (const entry of entries) {
        if (!entry.category) continue;
        const current = categoryMap.get(entry.category) ?? 0;
        categoryMap.set(entry.category, current + entry.amount);
        total += entry.amount;
    }

    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amountPaisa: amount,
        amountRupees: paisaToRupees(amount),
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));
}

/**
 * Gets monthly cashback trend for last 6 months
 */
async function getMonthlyTrend(
    userId: string,
    since: Date
): Promise<MonthlyTrend[]> {
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            userId,
            status: 'SETTLED',
            createdAt: { gte: since },
            type: { not: 'CASHBACK_SETTLEMENT' }, // Avoid double counting settlement transfers
        },
        select: {
            amount: true,
            direction: true,
            createdAt: true,
        },
    });

    const monthMap = new Map<
        string,
        { earned: number; spent: number; year: number; monthIndex: number }
    >();

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    for (const entry of entries) {
        const date = new Date(entry.createdAt);
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const key = `${year}-${monthIndex}`;

        let current = monthMap.get(key);
        if (!current) {
            current = { earned: 0, spent: 0, year, monthIndex };
            monthMap.set(key, current);
        }

        if (entry.direction === 'CREDIT') {
            current.earned += entry.amount;
        } else {
            current.spent += entry.amount;
        }
    }

    return Array.from(monthMap.entries())
        .map(([key, data]) => ({
            month: `${months[data.monthIndex]} ${data.year}`,
            year: data.year,
            monthIndex: data.monthIndex,
            amountPaisa: data.earned,
            amountRupees: paisaToRupees(data.earned),
            spentPaisa: data.spent,
            spentRupees: paisaToRupees(data.spent),
        }))
        .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.monthIndex - b.monthIndex;
        });
}

/**
 * Gets top 5 merchants by cashback this month
 */
async function getTopMerchants(
    userId: string,
    since: Date
): Promise<TopMerchant[]> {
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            userId,
            direction: 'CREDIT',
            status: 'SETTLED',
            merchantId: { not: null },
            createdAt: { gte: since },
        },
        select: {
            merchantId: true,
            merchantName: true,
            amount: true,
        },
    });

    const merchantMap = new Map<
        string,
        { name: string; amount: number; count: number }
    >();

    for (const entry of entries) {
        if (!entry.merchantId) continue;
        const current = merchantMap.get(entry.merchantId);
        if (current) {
            current.amount += entry.amount;
            current.count += 1;
        } else {
            merchantMap.set(entry.merchantId, {
                name: entry.merchantName ?? 'Unknown',
                amount: entry.amount,
                count: 1,
            });
        }
    }

    return Array.from(merchantMap.entries())
        .map(([merchantId, data]) => ({
            merchantId,
            merchantName: data.name,
            amountPaisa: data.amount,
            amountRupees: paisaToRupees(data.amount),
            transactionCount: data.count,
        }))
        .sort((a, b) => b.amountPaisa - a.amountPaisa)
        .slice(0, 5);
}

/**
 * Calculates savings rate: lifetime earned as % of total spend
 */
async function getSavingsRate(
    userId: string
): Promise<{
    percentage: number;
    lifetimeEarnedPaisa: number;
    lifetimeEarnedRupees: number;
    totalSpentPaisa: number;
    totalSpentRupees: number;
}> {
    const [lifetimeEarned, totalSpent] = await Promise.all([
        prisma.ledgerEntry.aggregate({
            where: {
                userId,
                direction: 'CREDIT',
                status: 'SETTLED',
            },
            _sum: { amount: true },
        }),
        prisma.ledgerEntry.aggregate({
            where: {
                userId,
                direction: 'DEBIT',
                status: 'SETTLED',
            },
            _sum: { amount: true },
        }),
    ]);

    const earned = lifetimeEarned._sum.amount ?? 0;
    const spent = totalSpent._sum.amount ?? 0;

    return {
        percentage: spent > 0 ? Math.round((earned / spent) * 100) : 0,
        lifetimeEarnedPaisa: earned,
        lifetimeEarnedRupees: paisaToRupees(earned),
        totalSpentPaisa: spent,
        totalSpentRupees: paisaToRupees(spent),
    };
}

// ============================================
// CRON JOB QUERIES
// ============================================

/**
 * Gets pending entries older than specified hours
 * Used by settlement cron job
 */
export async function getPendingEntriesOlderThan(
    hours: number = CASHBACK_SETTLEMENT_HOURS
): Promise<PendingEntry[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    try {
        const entries = await prisma.ledgerEntry.findMany({
            where: {
                type: 'CASHBACK_CREDIT',
                status: 'PENDING',
                createdAt: { lt: cutoffTime },
            },
            select: {
                id: true,
                userId: true,
                amount: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        return entries.map((entry: {
            id: string;
            userId: string;
            amount: number;
            createdAt: Date;
        }) => ({
            id: entry.id,
            userId: entry.userId,
            amountPaisa: entry.amount,
            createdAt: entry.createdAt,
        }));
    } catch (error) {
        throw new WalletError(
            'Failed to fetch pending entries',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Maps Prisma LedgerEntry to response format
 */
function mapLedgerEntryToResponse(entry: {
    id: string;
    type: string;
    direction: string;
    amount: number;
    balanceAfter: number;
    status: string;
    merchantId: string | null;
    merchantName: string | null;
    category: string | null;
    description: string | null;
    isFlagged: boolean;
    flagReason: string | null;
    createdAt: Date;
    settledAt: Date | null;
}): LedgerEntryResponse {
    return {
        id: entry.id,
        type: entry.type as LedgerType,
        direction: entry.direction as LedgerDirection,
        amountPaisa: entry.amount,
        amountRupees: paisaToRupees(entry.amount),
        balanceAfterPaisa: entry.balanceAfter,
        balanceAfterRupees: paisaToRupees(entry.balanceAfter),
        status: entry.status as LedgerStatus,
        merchantId: entry.merchantId,
        merchantName: entry.merchantName,
        category: entry.category,
        description: entry.description,
        isFlagged: entry.isFlagged,
        flagReason: entry.flagReason,
        createdAt: entry.createdAt,
        settledAt: entry.settledAt,
        statusBadge: getStatusBadge(entry.status, entry.isFlagged),
    };
}

/**
 * Gets status badge configuration for UI display
 */
function getStatusBadge(
    status: string,
    isFlagged: boolean
): { label: string; color: 'green' | 'yellow' | 'red' | 'blue' | 'gray' } {
    if (isFlagged) {
        return { label: 'Flagged', color: 'red' };
    }

    switch (status) {
        case 'SETTLED':
            return { label: 'Completed', color: 'green' };
        case 'PENDING':
            return { label: 'Pending', color: 'yellow' };
        case 'HELD':
            return { label: 'On Hold', color: 'red' };
        case 'CANCELLED':
            return { label: 'Cancelled', color: 'gray' };
        default:
            return { label: status, color: 'gray' };
    }
}
