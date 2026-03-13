// ============================================
// WALLET SERVICE - TYPESCRIPT TYPES
// Type definitions for wallet operations
// ============================================

// ============================================
// BALANCE TYPES
// ============================================

/**
 * Wallet balance in both paisa (storage) and rupees (display)
 */
export interface WalletBalance {
    /** Available balance in paisa (spendable now) */
    availablePaisa: number;
    /** Available balance in rupees for display */
    availableRupees: number;
    /** Pending balance in paisa (cashback not yet settled) */
    pendingPaisa: number;
    /** Pending balance in rupees for display */
    pendingRupees: number;
    /** Locked balance in paisa (held in active FDs) */
    lockedPaisa: number;
    /** Locked balance in rupees for display */
    lockedRupees: number;
    /** Lifetime earned cashback in paisa */
    lifetimeEarnedPaisa: number;
    /** Lifetime earned cashback in rupees for display */
    lifetimeEarnedRupees: number;
    /** Total balance (available + pending + locked) in paisa */
    totalPaisa: number;
    /** Total balance in rupees for display */
    totalRupees: number;
}

// ============================================
// LEDGER TYPES
// ============================================

/**
 * Status values for ledger entries
 */
export type LedgerStatus = 'PENDING' | 'SETTLED' | 'HELD' | 'CANCELLED';

/**
 * Type values for ledger entries
 */
export type LedgerType =
    | 'CASHBACK_CREDIT'
    | 'CASHBACK_SETTLEMENT'
    | 'PAYU_SPEND'
    | 'FD_LOCK'
    | 'FD_UNLOCK'
    | 'FD_INTEREST';

/**
 * Direction of ledger entry
 */
export type LedgerDirection = 'CREDIT' | 'DEBIT';

/**
 * Filter options for ledger queries
 */
export interface LedgerFilters {
    /** Filter by entry type */
    type?: LedgerType | 'ALL' | 'CREDITS' | 'SPENDS' | 'FD' | 'FLAGGED';
    /** Filter by status */
    status?: LedgerStatus | 'ALL';
    /** Start date for date range filter */
    startDate?: Date;
    /** End date for date range filter */
    endDate?: Date;
    /** Pagination: number of entries per page */
    limit?: number;
    /** Pagination: number of entries to skip */
    offset?: number;
}

/**
 * Response shape for ledger entries
 */
export interface LedgerEntryResponse {
    id: string;
    type: LedgerType;
    direction: LedgerDirection;
    amountPaisa: number;
    amountRupees: number;
    balanceAfterPaisa: number;
    balanceAfterRupees: number;
    status: LedgerStatus;
    merchantId: string | null;
    merchantName: string | null;
    category: string | null;
    description: string | null;
    isFlagged: boolean;
    flagReason: string | null;
    createdAt: Date;
    settledAt: Date | null;
    statusBadge: {
        label: string;
        color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
    };
}

// ============================================
// ANALYTICS TYPES
// ============================================

/**
 * Category breakdown item
 */
export interface CategoryBreakdown {
    category: string;
    amountPaisa: number;
    amountRupees: number;
    percentage: number;
}

/**
 * Monthly trend item
 */
export interface MonthlyTrend {
    month: string; // Format: "Jan 2026"
    year: number;
    monthIndex: number; // 0-11
    amountPaisa: number;
    amountRupees: number;
    spentPaisa: number;
    spentRupees: number;
}

/**
 * Top merchant item
 */
export interface TopMerchant {
    merchantId: string;
    merchantName: string;
    amountPaisa: number;
    amountRupees: number;
    transactionCount: number;
}

/**
 * Complete wallet analytics response
 */
export interface WalletAnalytics {
    /** Category breakdown for last 30 days */
    categoryBreakdown: CategoryBreakdown[];
    /** Monthly cashback trend for last 6 months */
    monthlyTrend: MonthlyTrend[];
    /** Top 5 merchants by cashback this month */
    topMerchants: TopMerchant[];
    /** Savings rate: lifetime earned as % of total spend */
    savingsRate: {
        percentage: number;
        lifetimeEarnedPaisa: number;
        lifetimeEarnedRupees: number;
        totalSpentPaisa: number;
        totalSpentRupees: number;
    };
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for crediting cashback
 */
export interface CreditCashbackInput {
    userId: string;
    amountPaisa: number;
    merchantId: string;
    merchantName: string;
    category: string;
    description: string;
}

/**
 * Input for spending balance
 */
export interface SpendBalanceInput {
    userId: string;
    amountPaisa: number;
    merchantId: string;
    merchantName: string;
    description: string;
}

/**
 * Input for FD lock operation
 */
export interface FDLockInput {
    userId: string;
    amountPaisa: number;
    fdId: string;
}

/**
 * Input for FD unlock operation
 */
export interface FDUnlockInput {
    userId: string;
    principalPaisa: number;
    interestPaisa: number;
    fdId: string;
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Service error structure
 */
export interface ServiceError {
    error: {
        message: string;
        code: string;
    };
}

/**
 * Custom error class for wallet operations
 */
export class WalletError extends Error {
    code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'WalletError';
        this.code = code;
    }
}

// ============================================
// PENDING ENTRY TYPES
// ============================================

/**
 * Pending entry for settlement cron job
 */
export interface PendingEntry {
    id: string;
    userId: string;
    amountPaisa: number;
    createdAt: Date;
}
