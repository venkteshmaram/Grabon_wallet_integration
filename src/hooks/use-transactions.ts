// ============================================
// USE TRANSACTIONS HOOK - Ledger Management
// Step 4: API Client + Custom Hooks
// ============================================

import { useEffect, useCallback, useMemo } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import type { LedgerEntry } from '@/store/wallet-store';

// ============================================
// TYPES
// ============================================

/** Transaction filter types matching UI requirements */
type TransactionFilter = 'ALL' | 'CREDITS' | 'SPENDS' | 'FD' | 'FLAGGED';

/** Hook configuration options */
interface UseTransactionsOptions {
    /** User ID to fetch transactions for */
    userId: string | undefined;
    /** Filter type for transactions */
    filter?: TransactionFilter;
    /** Page number for pagination (1-based) */
    page?: number;
    /** Number of items per page */
    pageSize?: number;
    /** Optional start date (ISO string) */
    startDate?: string;
    /** Optional end date (ISO string) */
    endDate?: string;
    /** Optional merchant filter */
    merchantId?: string;
}

/** Hook return type */
interface UseTransactionsReturn {
    /** Filtered transaction entries */
    transactions: LedgerEntry[];
    /** Loading state for fetch operations */
    isLoading: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Total count for pagination */
    totalCount: number;
    /** Manual refetch function */
    refetch: () => Promise<void>;
}

// ============================================
// FILTER MAPPING
// ============================================

/**
 * Maps UI filter types to API query parameters
 * Centralized mapping for consistency across the app
 */
const FILTER_TYPE_MAP: Record<Exclude<TransactionFilter, 'ALL' | 'FLAGGED'>, string> = {
    CREDITS: 'CASHBACK_CREDIT,CASHBACK_SETTLEMENT,FD_INTEREST',
    SPENDS: 'PAYU_SPEND',
    FD: 'FD_LOCK,FD_UNLOCK',
};

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook for fetching and filtering transaction ledger
 * 
 * Features:
 * - Supports multiple filter types (ALL, CREDITS, SPENDS, FD, FLAGGED)
 * - Automatic refetch when filter or pagination changes
 * - Returns filtered transactions from store
 * - Memoized filter logic for performance
 * 
 * @param options - Configuration object with userId, filter, page, pageSize
 * @returns Transactions data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { transactions, isLoading, error, refetch } = useTransactions({
 *   userId: 'user-123',
 *   filter: 'CREDITS',
 *   page: 1,
 *   pageSize: 20,
 * });
 * ```
 */
export function useTransactions({
    userId,
    filter = 'ALL',
    page = 1,
    pageSize = 50,
    startDate,
    endDate,
    merchantId,
}: UseTransactionsOptions): UseTransactionsReturn {
    // Get state and actions from wallet store
    const ledger = useWalletStore((state) => state.ledger);
    const isLoading = useWalletStore((state) => state.isLoading);
    const error = useWalletStore((state) => state.error);
    const fetchLedger = useWalletStore((state) => state.fetchLedger);

    /**
     * Build API filters based on UI filter type
     * Memoized to prevent unnecessary effect triggers
     */
    const apiFilters = useMemo(() => {
        const filters: {
            type?: string;
            isFlagged?: boolean;
            page: number;
            limit: number;
            startDate?: string;
            endDate?: string;
        } = {
            page,
            limit: pageSize,
        };

        if (filter !== 'ALL' && filter !== 'FLAGGED') {
            filters.type = FILTER_TYPE_MAP[filter];
        }

        if (filter === 'FLAGGED') {
            filters.isFlagged = true;
        }

        if (startDate) {
            filters.startDate = startDate;
        }

        if (endDate) {
            filters.endDate = endDate;
        }

        return filters;
    }, [filter, page, pageSize, startDate, endDate]);

    /**
     * Filter transactions client-side as a fallback
     * Also used when API doesn't support all filter types
     */
    const filteredTransactions = useMemo(() => {
        if (!ledger) {
            return [];
        }

        return ledger.filter((entry) => {
            if (merchantId && entry.merchantId !== merchantId) {
                return false;
            }

            switch (filter) {
                case 'CREDITS':
                    return ['CASHBACK_CREDIT', 'CASHBACK_SETTLEMENT', 'FD_INTEREST'].includes(entry.type);
                case 'SPENDS':
                    return entry.type === 'PAYU_SPEND';
                case 'FD':
                    return ['FD_LOCK', 'FD_UNLOCK'].includes(entry.type);
                case 'FLAGGED':
                    return entry.isFlagged;
                default:
                    return true;
            }
        });
    }, [ledger, filter, merchantId]);

    /**
     * Manual refetch function
     * Fetches ledger with current filter settings
     */
    const refetch = useCallback(async (): Promise<void> => {
        if (!userId) {
            return;
        }

        await fetchLedger(userId, {
            type: apiFilters.type,
            isFlagged: apiFilters.isFlagged,
            merchantId,
            startDate: apiFilters.startDate,
            endDate: apiFilters.endDate,
            page: apiFilters.page,
            limit: apiFilters.limit,
        });
    }, [userId, apiFilters, fetchLedger, merchantId]);

    /**
     * Auto-fetch on mount and when dependencies change
     */
    useEffect(() => {
        if (!userId) {
            return;
        }

        fetchLedger(userId, {
            type: apiFilters.type,
            isFlagged: apiFilters.isFlagged,
            merchantId,
            startDate: apiFilters.startDate,
            endDate: apiFilters.endDate,
            page: apiFilters.page,
            limit: apiFilters.limit,
        });
    }, [userId, apiFilters, fetchLedger, merchantId]);

    return {
        transactions: filteredTransactions,
        isLoading,
        error,
        totalCount: filteredTransactions.length,
        refetch,
    };
}

// ============================================
// EXPORTS
// ============================================

export type { TransactionFilter, UseTransactionsOptions, UseTransactionsReturn };
