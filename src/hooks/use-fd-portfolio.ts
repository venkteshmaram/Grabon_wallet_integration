// ============================================
// USE FD PORTFOLIO HOOK - Fixed Deposit Management
// Step 4: API Client + Custom Hooks
// ============================================

import { useEffect, useCallback, useMemo } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import { apiPost } from '@/lib/api-client';
import type { FDRecord } from '@/store/wallet-store';

// ============================================
// TYPES
// ============================================

/** Hook return type */
interface UseFdPortfolioReturn {
    /** Array of FD records */
    fds: FDRecord[];
    /** Total portfolio value (sum of all active FD maturity amounts) */
    totalPortfolioValue: number;
    /** Loading state for fetch operations */
    isLoading: boolean;
    /** Error message if operation failed */
    error: string | null;
    /** Create a new FD investment */
    createFD: (principal: number, tenureDays: number) => Promise<FDRecord | null>;
    /** Break an existing FD */
    breakFD: (fdId: string) => Promise<FDRecord | null>;
    /** Manual refetch function */
    refetch: () => Promise<void>;
}

/** API response types */
interface CreateFDResponse {
    data: FDRecord;
}

interface BreakFDResponse {
    data: FDRecord;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook for managing Fixed Deposit (FD) portfolio
 * 
 * Features:
 * - Fetches all FDs for the user
 * - Computes total portfolio value
 * - Provides createFD and breakFD operations
 * - Auto-refreshes wallet balance after mutations
 * 
 * @param userId - The user ID to fetch FDs for
 * @returns FD data, computed values, operations, and state
 * 
 * @example
 * ```tsx
 * const { fds, totalPortfolioValue, createFD, breakFD, isLoading } = useFdPortfolio('user-123');
 * 
 * // Create a new FD
 * await createFD(50000, 90); // ₹50,000 for 90 days
 * 
 * // Break an existing FD
 * await breakFD('fd-abc-123');
 * ```
 */
export function useFdPortfolio(userId: string | undefined): UseFdPortfolioReturn {
    // Get state and actions from wallet store
    const fds = useWalletStore((state) => state.fds) ?? [];
    const isLoading = useWalletStore((state) => state.isLoading);
    const error = useWalletStore((state) => state.error);
    const fetchFDs = useWalletStore((state) => state.fetchFDs);
    const fetchWallet = useWalletStore((state) => state.fetchWallet);

    /**
     * Compute total portfolio value
     * Sum of maturity amounts for all ACTIVE FDs
     */
    const totalPortfolioValue = useMemo(() => {
        return fds
            .filter((fd) => fd.status === 'ACTIVE')
            .reduce((sum, fd) => sum + fd.maturityAmount, 0);
    }, [fds]);

    /**
     * Create a new Fixed Deposit
     * 
     * @param principal - Amount to invest (in rupees)
     * @param tenureDays - Duration in days (e.g., 30, 60, 90, 180, 365)
     * @returns The created FD record or null if failed
     */
    const createFD = useCallback(
        async (principal: number, tenureDays: number): Promise<FDRecord | null> => {
            if (!userId) {
                return null;
            }

            try {
                // Convert rupees to paisa for API
                const principalPaisa = Math.round(principal * 100);

                const response = await apiPost<CreateFDResponse>('/api/fd/create', {
                    userId,
                    principal: principalPaisa,
                    tenureDays,
                });

                if (response.data) {
                    // Refetch FDs and wallet to update UI
                    await Promise.all([
                        fetchFDs(userId),
                        fetchWallet(userId),
                    ]);

                    return response.data;
                }

                return null;
            } catch (err) {
                console.error('Failed to create FD:', err);
                return null;
            }
        },
        [userId, fetchFDs, fetchWallet]
    );

    /**
     * Break (prematurely close) an existing FD
     * 
     * @param fdId - The ID of the FD to break
     * @returns The broken FD record or null if failed
     */
    const breakFD = useCallback(
        async (fdId: string): Promise<FDRecord | null> => {
            if (!userId) {
                return null;
            }

            try {
                const response = await apiPost<BreakFDResponse>(`/api/fd/${fdId}/break`, {
                    userId,
                });

                if (response.data) {
                    // Refetch FDs and wallet to update UI
                    await Promise.all([
                        fetchFDs(userId),
                        fetchWallet(userId),
                    ]);

                    return response.data;
                }

                return null;
            } catch (err) {
                console.error('Failed to break FD:', err);
                return null;
            }
        },
        [userId, fetchFDs, fetchWallet]
    );

    /**
     * Manual refetch function
     */
    const refetch = useCallback(async (): Promise<void> => {
        if (!userId) {
            return;
        }
        await fetchFDs(userId);
    }, [userId, fetchFDs]);

    /**
     * Auto-fetch on mount when userId changes
     */
    useEffect(() => {
        if (!userId) {
            return;
        }

        // Only fetch if FD data is not already present
        if (fds.length === 0) {
            fetchFDs(userId);
        }
    }, [userId, fds.length, fetchFDs]);

    return {
        fds,
        totalPortfolioValue,
        isLoading,
        error,
        createFD,
        breakFD,
        refetch,
    };
}

// ============================================
// EXPORTS
// ============================================

export type { UseFdPortfolioReturn };
