// ============================================
// USE ADVISOR HOOK - AI Financial Advisor
// Step 4: API Client + Custom Hooks
// ============================================

import { useEffect, useCallback, useState, useRef } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import { apiPost } from '@/lib/api-client';
import type { AdvisorRecommendation } from '@/store/wallet-store';

// ============================================
// TYPES
// ============================================

/** Hook return type */
interface UseAdvisorReturn {
    /** Advisor recommendation data or null if not available */
    advisor: AdvisorRecommendation | null;
    /** Loading state for initial fetch */
    isLoading: boolean;
    /** Loading state specifically for refresh operation */
    isRefreshing: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Refresh advisor recommendation (triggers Claude API call) */
    refresh: () => Promise<void>;
}

/** API response types */
interface RefreshAdvisorResponse {
    data: AdvisorRecommendation;
}

// ============================================
// CONSTANTS
// ============================================

/** Timeout for advisor refresh (Claude API can take 5-10 seconds) */
const REFRESH_TIMEOUT_MS = 30000; // 30 seconds

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook for AI Financial Advisor recommendations
 * 
 * Features:
 * - Fetches existing advisor recommendation on mount
 * - Provides refresh function that triggers real Claude API call
 * - Separate loading states for initial fetch vs refresh
 * - Handles null recommendations gracefully (new users)
 * 
 * @param userId - The user ID to fetch advisor for
 * @returns Advisor data, loading states, error, and refresh function
 * 
 * @example
 * ```tsx
 * const { advisor, isLoading, isRefreshing, error, refresh } = useAdvisor('user-123');
 * 
 * if (isLoading) return <Skeleton />;
 * 
 * return (
 *   <AdvisorCard
 *     recommendation={advisor}
 *     onRefresh={refresh}
 *     isRefreshing={isRefreshing}
 *   />
 * );
 * ```
 */
export function useAdvisor(userId: string | undefined): UseAdvisorReturn {
    // Get state and actions from wallet store
    const advisor = useWalletStore((state) => state.advisor);
    const isLoading = useWalletStore((state) => state.status.advisor.loading);
    const error = useWalletStore((state) => state.status.advisor.error);
    const fetchAdvisor = useWalletStore((state) => state.fetchAdvisor);

    // Separate loading state for refresh operation (Claude API call)
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);

    // Track if we've attempted a fetch to prevent race conditions
    const hasAttemptedFetch = useRef(false);
    const lastUserId = useRef<string | undefined>(undefined);

    /**
     * Refresh advisor recommendation
     * This triggers a real Claude API call which may take 5-10 seconds
     */
    const refresh = useCallback(async (): Promise<void> => {
        if (!userId) {
            return;
        }

        setIsRefreshing(true);
        setRefreshError(null);

        try {
            // Use the real-time refresh action from useWalletStore
            const refreshAdvisor = useWalletStore.getState().refreshAdvisor;
            await refreshAdvisor(userId);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to refresh advisor recommendation';

            setRefreshError(errorMessage);
            console.error('Advisor refresh failed:', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [userId, fetchAdvisor]);

    /**
     * Auto-fetch on mount when userId changes
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
            fetchAdvisor(userId);
        }
    }, [userId, fetchAdvisor]);

    return {
        advisor,
        isLoading,
        isRefreshing,
        error: error ?? refreshError,
        refresh,
    };
}

// ============================================
// EXPORTS
// ============================================

export type { UseAdvisorReturn };
