// ============================================
// WALLET STORE - Zustand Wallet Data Management
// Step 3: Zustand Stores - All wallet-related state
// ============================================

import { create } from 'zustand';
import { apiGet } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

interface CurrentUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

interface Wallet {
    availablePaisa: number;
    availableRupees: number;
    pendingPaisa: number;
    pendingRupees: number;
    lockedPaisa: number;
    lockedRupees: number;
    lifetimeEarnedPaisa: number;
    lifetimeEarnedRupees: number;
    totalPaisa: number;
    totalRupees: number;
}

interface LedgerFilters {
    type?: string;
    isFlagged?: boolean;
    merchantId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

interface LedgerEntry {
    id: string;
    type: 'CASHBACK_CREDIT' | 'CASHBACK_SETTLEMENT' | 'PAYU_SPEND' | 'FD_LOCK' | 'FD_UNLOCK' | 'FD_INTEREST' | 'FRAUD_HOLD' | 'FRAUD_RELEASE';
    direction: 'CREDIT' | 'DEBIT';
    amount: number;
    balanceAfter: number;
    status: 'PENDING' | 'SETTLED' | 'HELD' | 'RELEASED' | 'FAILED';
    merchantId: string | null;
    merchantName: string | null;
    category: string | null;
    description: string | null;
    fdId: string | null;
    isFlagged: boolean;
    flagReason: string | null;
    createdAt: string;
    settledAt: string | null;
}

interface FDRecord {
    id: string;
    principal: number;
    interestRate: number;
    tenureDays: number;
    maturityAmount: number;
    interestEarned: number;
    startDate: string;
    maturityDate: string;
    status: 'ACTIVE' | 'MATURED' | 'BROKEN';
    accruedInterest: number;
    daysRemaining: number;
    penaltyAmount: number | null;
    actualReturn: number | null;
    brokenAt: string | null;
}

interface AdvisorRecommendation {
    id: string;
    summary: string;
    recommendation: string;
    actionItems: string[];
    alert: string | null;
    generatedAt: string;
}

interface CategoryBreakdown {
    category: string;
    amountPaisa: number;
    amountRupees: number;
    percentage: number;
}

interface MonthlyTrend {
    month: string;
    year: number;
    monthIndex: number;
    amountPaisa: number;
    amountRupees: number;
    spentPaisa: number;
    spentRupees: number;
}

interface TopMerchant {
    merchantId: string;
    merchantName: string;
    amountPaisa: number;
    amountRupees: number;
    transactionCount: number;
}

interface WalletAnalytics {
    categoryBreakdown: CategoryBreakdown[];
    monthlyTrend: MonthlyTrend[];
    topMerchants: TopMerchant[];
    savingsRate: {
        percentage: number;
        lifetimeEarnedPaisa: number;
        lifetimeEarnedRupees: number;
        totalSpentPaisa: number;
        totalSpentRupees: number;
    };
}

// API Response types
interface WalletApiResponse {
    data: Wallet;
}

interface LedgerApiResponse {
    data: {
        entries: LedgerEntry[];
        pagination?: {
            total: number;
            page: number;
            limit: number;
        };
    };
}

interface FDsApiResponse {
    data: {
        portfolio: {
            fds: Array<{
                id: string;
                principalPaisa?: number;
                principalRupees?: number;
                principal?: number;
                interestRate: number;
                tenureDays: number;
                maturityAmountPaisa?: number;
                maturityAmountRupees?: number;
                maturityAmount?: number;
                interestEarnedPaisa?: number;
                interestEarnedRupees?: number;
                interestEarned?: number;
                startDate: string;
                maturityDate: string;
                status: 'ACTIVE' | 'MATURED' | 'BROKEN';
                accruedInterestPaisa?: number;
                accruedInterestRupees?: number;
                accruedInterest?: number;
                daysRemaining: number;
                penaltyAmountPaisa?: number | null;
                penaltyAmountRupees?: number | null;
                penaltyAmount?: number | null;
                actualReturnPaisa?: number | null;
                actualReturnRupees?: number | null;
                actualReturn?: number | null;
                brokenAt: string | null;
            }>;
        };
    };
}

interface AdvisorApiResponse {
    data: AdvisorRecommendation | null;
}

interface AnalyticsApiResponse {
    data: WalletAnalytics;
}

// ============================================
// WALLET STORE STATE
// ============================================

interface WalletState {
    // State
    currentUser: CurrentUser | null;
    wallet: Wallet | null;
    ledger: LedgerEntry[] | null;
    fds: FDRecord[] | null;
    advisor: AdvisorRecommendation | null;
    analytics: WalletAnalytics | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: CurrentUser) => void;
    fetchWallet: (userId: string) => Promise<void>;
    fetchLedger: (userId: string, filters?: LedgerFilters) => Promise<void>;
    fetchFDs: (userId: string) => Promise<void>;
    fetchAdvisor: (userId: string) => Promise<void>;
    fetchAnalytics: (userId: string) => Promise<void>;
    refreshAll: (userId: string) => Promise<void>;
    clearStore: () => void;
}

// ============================================
// PAISA TO RUPEES CONVERSION
// ============================================

const PAISA_TO_RUPEES = 100;

function convertPaisaToRupees(paisa: number): number {
    return paisa / PAISA_TO_RUPEES;
}

function convertWalletFromPaisa(walletData: Wallet): Wallet {
    // API already returns both paisa and rupees values, just pass through
    return walletData;
}

function convertLedgerEntryFromPaisa(entry: LedgerEntry): LedgerEntry {
    return {
        ...entry,
        amount: convertPaisaToRupees(entry.amount),
        balanceAfter: convertPaisaToRupees(entry.balanceAfter),
    };
}

function convertFDFromPaisa(fd: FDsApiResponse['data']['portfolio']['fds'][number]): FDRecord {
    const principalRupees = fd.principalRupees ?? (typeof fd.principal === 'number' ? convertPaisaToRupees(fd.principal) : 0);
    const maturityAmountRupees = fd.maturityAmountRupees ?? (typeof fd.maturityAmount === 'number' ? convertPaisaToRupees(fd.maturityAmount) : 0);
    const interestEarnedRupees = fd.interestEarnedRupees ?? (typeof fd.interestEarned === 'number' ? convertPaisaToRupees(fd.interestEarned) : 0);
    const accruedInterestRupees = fd.accruedInterestRupees ?? (typeof fd.accruedInterest === 'number' ? convertPaisaToRupees(fd.accruedInterest) : 0);
    const penaltyAmountRupees =
        typeof fd.penaltyAmountRupees === 'number'
            ? fd.penaltyAmountRupees
            : typeof fd.penaltyAmount === 'number'
                ? convertPaisaToRupees(fd.penaltyAmount)
                : null;
    const actualReturnRupees =
        typeof fd.actualReturnRupees === 'number'
            ? fd.actualReturnRupees
            : typeof fd.actualReturn === 'number'
                ? convertPaisaToRupees(fd.actualReturn)
                : null;

    return {
        id: fd.id,
        principal: principalRupees,
        interestRate: fd.interestRate,
        tenureDays: fd.tenureDays,
        maturityAmount: maturityAmountRupees,
        interestEarned: interestEarnedRupees,
        startDate: fd.startDate,
        maturityDate: fd.maturityDate,
        status: fd.status,
        accruedInterest: accruedInterestRupees,
        daysRemaining: fd.daysRemaining,
        penaltyAmount: penaltyAmountRupees,
        actualReturn: actualReturnRupees,
        brokenAt: fd.brokenAt,
    };
}

function convertAnalyticsFromPaisa(analytics: WalletAnalytics): WalletAnalytics {
    return analytics; // Service already returns both paisa and rupees
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useWalletStore = create<WalletState>()((set) => ({
    // Initial State
    currentUser: null,
    wallet: null,
    ledger: null,
    fds: null,
    advisor: null,
    analytics: null,
    isLoading: false,
    error: null,

    // ============================================
    // SET USER
    // ============================================
    setUser: (user: CurrentUser) => {
        set({ currentUser: user });
    },

    // ============================================
    // FETCH WALLET BALANCE
    // ============================================
    fetchWallet: async (userId: string) => {
        try {
            const response = await apiGet<WalletApiResponse>(`/api/wallet/${userId}`);

            if (response.data) {
                set({
                    wallet: convertWalletFromPaisa(response.data),
                    error: null,
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet';
            set({ error: errorMessage });
        }
    },

    // ============================================
    // FETCH LEDGER
    // ============================================
    fetchLedger: async (userId: string, filters?: LedgerFilters) => {
        try {
            const queryParams = filters
                ? '?' + new URLSearchParams(
                    Object.entries(filters)
                        .filter(([, v]) => v !== undefined)
                        .map(([k, v]) => [k, String(v)])
                ).toString()
                : '';

            const response = await apiGet<LedgerApiResponse>(`/api/wallet/${userId}/ledger${queryParams}`);

            if (response.data?.entries) {
                set({
                    ledger: response.data.entries.map(convertLedgerEntryFromPaisa),
                    error: null,
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ledger';
            set({ error: errorMessage });
        }
    },

    // ============================================
    // FETCH FDs
    // ============================================
    fetchFDs: async (userId: string) => {
        try {
            const response = await apiGet<FDsApiResponse>(`/api/fd/user/${userId}`);

            if (response.data?.portfolio?.fds) {
                set({
                    fds: response.data.portfolio.fds.map(convertFDFromPaisa),
                    error: null,
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch FDs';
            set({ error: errorMessage });
        }
    },

    // ============================================
    // FETCH ADVISOR
    // ============================================
    fetchAdvisor: async (userId: string) => {
        try {
            const response = await apiGet<AdvisorApiResponse>(`/api/advisor/${userId}`);

            set({
                advisor: response.data,
                error: null,
            });
        } catch (err) {
            // Advisor may be null for new users - don't set error
            set({ advisor: null });
        }
    },

    // ============================================
    // FETCH ANALYTICS
    // ============================================
    fetchAnalytics: async (userId: string) => {
        try {
            const response = await apiGet<AnalyticsApiResponse>(`/api/wallet/${userId}/analytics`);

            if (response.data) {
                set({
                    analytics: convertAnalyticsFromPaisa(response.data),
                    error: null,
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
            set({ error: errorMessage });
        }
    },

    // ============================================
    // REFRESH ALL DATA
    // ============================================
    refreshAll: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
            // Fetch all data in parallel
            const results = await Promise.allSettled([
                useWalletStore.getState().fetchWallet(userId),
                useWalletStore.getState().fetchLedger(userId),
                useWalletStore.getState().fetchFDs(userId),
                useWalletStore.getState().fetchAdvisor(userId),
                useWalletStore.getState().fetchAnalytics(userId),
            ]);

            // Check for any failures
            const failures = results.filter((r) => r.status === 'rejected');
            if (failures.length > 0) {
                console.warn('Some fetches failed:', failures);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
            set({ error: errorMessage });
        } finally {
            set({ isLoading: false });
        }
    },

    // ============================================
    // CLEAR STORE
    // ============================================
    clearStore: () => {
        set({
            currentUser: null,
            wallet: null,
            ledger: null,
            fds: null,
            advisor: null,
            analytics: null,
            isLoading: false,
            error: null,
        });
    },
}));

// ============================================
// DEVTOOLS EXPOSE (for debugging only)
// ============================================

if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).useWalletStore = useWalletStore;
}

// ============================================
// EXPORTS
// ============================================

export type {
    CurrentUser,
    Wallet,
    LedgerEntry,
    LedgerFilters,
    FDRecord,
    AdvisorRecommendation,
    WalletAnalytics,
    CategoryBreakdown,
    MonthlyTrend,
    TopMerchant,
};
