// ============================================
// USE ANALYTICS HOOK - Wallet Analytics Data
// Step 4: API Client + Custom Hooks
// ============================================

import { useEffect, useCallback } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import type { WalletAnalytics } from '@/store/wallet-store';

// ============================================
// TYPES
// ============================================

/** Hook return type */
interface UseAnalyticsReturn {
    /** Analytics data or null if not loaded */
    analytics: WalletAnalytics | null;
    /** Loading state for fetch operations */
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
 * Hook for fetching wallet analytics data
 * 
 * Features:
 * - Fetches analytics data including:
 *   - Category breakdown (spending by category)
 *   - Monthly trend (earned vs spent over time)
 *   - Top merchants (by cashback)
 *   - Savings rate percentage
 * - Provides manual refetch capability
 * - Data stored in Zustand store (single source of truth)
 * 
 * @param userId - The user ID to fetch analytics for
 * @returns Analytics data, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { analytics, isLoading, error, refetch } = useAnalytics('user-123');
 * 
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error} onRetry={refetch} />;
 * 
 * return (
 *   <AnalyticsDashboard
 *     categoryData={analytics?.categoryBreakdown}
 *     monthlyTrend={analytics?.monthlyTrend}
 *     topMerchants={analytics?.topMerchants}
 *     savingsRate={analytics?.savingsRate}
 *   />
 * );
 * ```
 */
export function useAnalytics(userId: string | undefined): UseAnalyticsReturn {
    // Get state and actions from wallet store
    const analytics = useWalletStore((state) => state.analytics);
    const isLoading = useWalletStore((state) => state.isLoading);
    const error = useWalletStore((state) => state.error);
    const fetchAnalytics = useWalletStore((state) => state.fetchAnalytics);

    /**
     * Manual refetch function
     * Allows components to refresh analytics data on demand
     */
    const refetch = useCallback(async (): Promise<void> => {
        if (!userId) {
            return;
        }
        await fetchAnalytics(userId);
    }, [userId, fetchAnalytics]);

    /**
     * Auto-fetch on mount when userId changes
     * Guards against undefined userId to prevent unnecessary API calls
     */
    useEffect(() => {
        if (!userId) {
            return;
        }

        // Only fetch if analytics data is not already present
        // This prevents duplicate fetches on re-renders
        if (!analytics) {
            fetchAnalytics(userId);
        }
    }, [userId, analytics, fetchAnalytics]);

    return {
        analytics,
        isLoading,
        error,
        refetch,
    };
}

// ============================================
// EXPORTS
// ============================================

export type { UseAnalyticsReturn };
