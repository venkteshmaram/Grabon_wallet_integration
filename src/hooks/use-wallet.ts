// ============================================
// USE WALLET HOOK - Wallet Balance Management
// Step 4: API Client + Custom Hooks
// ============================================

import { useEffect, useCallback } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import type { Wallet } from '@/store/wallet-store';

// ============================================
// HOOK RETURN TYPE
// ============================================

interface UseWalletReturn {
    /** Wallet balance data or null if not loaded */
    wallet: Wallet | null;
    /** Loading state for initial fetch */
    isLoading: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Manual refetch function */
    refetch: () => Promise<void>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook for fetching and managing wallet balance
 * 
 * Features:
 * - Automatically fetches wallet data on mount when userId is provided
 * - Returns data from Zustand store (single source of truth)
 * - Provides manual refetch capability
 * - Handles loading and error states consistently
 * 
 * @param userId - The user ID to fetch wallet for
 * @returns Wallet data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { wallet, isLoading, error, refetch } = useWallet('user-123');
 * 
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error} onRetry={refetch} />;
 * 
 * return <BalanceCard balance={wallet?.availableBalance} />;
 * ```
 */
export function useWallet(userId: string | undefined): UseWalletReturn {
    // Get state and actions from wallet store
    const wallet = useWalletStore((state) => state.wallet);
    const isLoading = useWalletStore((state) => state.isLoading);
    const error = useWalletStore((state) => state.error);
    const fetchWallet = useWalletStore((state) => state.fetchWallet);

    /**
     * Manual refetch function
     * Allows components to refresh wallet data on demand
     */
    const refetch = useCallback(async (): Promise<void> => {
        if (!userId) {
            return;
        }
        await fetchWallet(userId);
    }, [userId, fetchWallet]);

    /**
     * Auto-fetch on mount when userId changes
     * Guards against undefined userId to prevent unnecessary API calls
     */
    useEffect(() => {
        if (!userId) {
            return;
        }

        // Only fetch if wallet data is not already present
        // This prevents duplicate fetches on re-renders
        if (!wallet) {
            fetchWallet(userId);
        }
    }, [userId, wallet, fetchWallet]);

    return {
        wallet,
        isLoading,
        error,
        refetch,
    };
}

// ============================================
// EXPORTS
// ============================================

export type { UseWalletReturn };
