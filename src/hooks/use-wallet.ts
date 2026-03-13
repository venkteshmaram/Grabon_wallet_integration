// ============================================
// USE WALLET HOOK - Wallet Balance Management
// Step 4: API Client + Custom Hooks
// ============================================

import { useEffect, useCallback, useRef } from 'react';
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
    const isLoading = useWalletStore((state) => state.status.wallet.loading);
    const error = useWalletStore((state) => state.status.wallet.error);
    const fetchWallet = useWalletStore((state) => state.fetchWallet);

    // Track if we've attempted a fetch to prevent race conditions
    const hasAttemptedFetch = useRef(false);
    const lastUserId = useRef<string | undefined>(undefined);

    /**
     * Manual refetch function
     * Allows components to refresh wallet data on demand
     */
    const refetch = useCallback(async (): Promise<void> => {
        if (!userId) {
            return;
        }
        hasAttemptedFetch.current = false; // Reset for manual refetch
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

        // Reset fetch attempt if userId changes
        if (lastUserId.current !== userId) {
            hasAttemptedFetch.current = false;
            lastUserId.current = userId;
        }

        // Only fetch once per userId session to prevent race conditions
        if (!hasAttemptedFetch.current) {
            hasAttemptedFetch.current = true;
            fetchWallet(userId);
        }
    }, [userId, fetchWallet]);

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
