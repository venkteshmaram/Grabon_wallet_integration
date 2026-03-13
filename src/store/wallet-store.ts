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

interface LoadingStatus {
    loading: boolean;
    error: string | null;
}

interface WalletState {
    // State
    currentUser: CurrentUser | null;
    wallet: Wallet | null;
    ledger: LedgerEntry[] | null;
    fds: FDRecord[] | null;
    advisor: AdvisorRecommendation | null;
    analytics: WalletAnalytics | null;

    // Status tracking per domain
    status: {
        wallet: LoadingStatus;
        ledger: LoadingStatus;
        fds: LoadingStatus;
        advisor: LoadingStatus;
        analytics: LoadingStatus;
    };

    // Actions
    setUser: (user: CurrentUser) => void;
    fetchWallet: (userId: string) => Promise<void>;
    fetchLedger: (userId: string, filters?: LedgerFilters) => Promise<void>;
    fetchFDs: (userId: string) => Promise<void>;
    fetchAdvisor: (userId: string) => Promise<void>;
    refreshAdvisor: (userId: string) => Promise<void>; // Real-time refresh
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
    return analytics;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

const initialStatus: LoadingStatus = { loading: false, error: null };

export const useWalletStore = create<WalletState>()((set, get) => ({
    // Initial State
    currentUser: null,
    wallet: null,
    ledger: null,
    fds: null,
    advisor: null,
    analytics: null,

    status: {
        wallet: initialStatus,
        ledger: initialStatus,
        fds: initialStatus,
        advisor: initialStatus,
        analytics: initialStatus,
    },

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
        set(state => ({ status: { ...state.status, wallet: { loading: true, error: null } } }));
        try {
            console.log(`[WalletStore] Fetching wallet for ${userId}...`);
            const response = await apiGet<WalletApiResponse>(`/api/wallet/${userId}`);
            console.log(`[WalletStore] Wallet response:`, response);

            if (response.data) {
                set(state => ({
                    wallet: convertWalletFromPaisa(response.data),
                    status: { ...state.status, wallet: { loading: false, error: null } }
                }));
            } else {
                set(state => ({
                    status: { ...state.status, wallet: { loading: false, error: 'No wallet data returned' } }
                }));
            }
        } catch (err) {
            console.error(`[WalletStore] Fetch wallet error:`, err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet';
            set(state => ({
                status: { ...state.status, wallet: { loading: false, error: errorMessage } }
            }));
        }
    },

    // ============================================
    // FETCH LEDGER
    // ============================================
    fetchLedger: async (userId: string, filters?: LedgerFilters) => {
        set(state => ({ status: { ...state.status, ledger: { loading: true, error: null } } }));
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
                set(state => ({
                    ledger: response.data.entries.map(convertLedgerEntryFromPaisa),
                    status: { ...state.status, ledger: { loading: false, error: null } }
                }));
            } else {
                set(state => ({
                    status: { ...state.status, ledger: { loading: false, error: 'No ledger data returned' } }
                }));
            }
        } catch (err) {
            console.error(`[WalletStore] Fetch ledger error:`, err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ledger';
            set(state => ({
                status: { ...state.status, ledger: { loading: false, error: errorMessage } }
            }));
        }
    },

    // ============================================
    // FETCH FDs
    // ============================================
    fetchFDs: async (userId: string) => {
        set(state => ({ status: { ...state.status, fds: { loading: true, error: null } } }));
        try {
            const response = await apiGet<FDsApiResponse>(`/api/fd/user/${userId}`);

            if (response.data?.portfolio?.fds) {
                set(state => ({
                    fds: response.data.portfolio.fds.map(convertFDFromPaisa),
                    status: { ...state.status, fds: { loading: false, error: null } }
                }));
            } else {
                set(state => ({
                    status: { ...state.status, fds: { loading: false, error: 'No FD data returned' } }
                }));
            }
        } catch (err) {
            console.error(`[WalletStore] Fetch FDs error:`, err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch FDs';
            set(state => ({
                status: { ...state.status, fds: { loading: false, error: errorMessage } }
            }));
        }
    },

    // ============================================
    // FETCH ADVISOR (Passive)
    // ============================================
    fetchAdvisor: async (userId: string) => {
        set(state => ({ status: { ...state.status, advisor: { loading: true, error: null } } }));
        try {
            const response = await apiGet<AdvisorApiResponse>(`/api/advisor/${userId}`);
            set(state => ({
                advisor: response.data,
                status: { ...state.status, advisor: { loading: false, error: null } }
            }));
        } catch (err) {
            console.warn(`[WalletStore] Fetch advisor error (might be new user):`, err);
            set(state => ({
                advisor: null,
                status: { ...state.status, advisor: { loading: false, error: null } }
            }));
        }
    },

    // ============================================
    // REFRESH ADVISOR (Active AI Generation)
    // ============================================
    refreshAdvisor: async (userId: string) => {
        set(state => ({ status: { ...state.status, advisor: { loading: true, error: null } } }));
        try {
            const { apiPost } = await import('@/lib/api-client');
            const response = await apiPost<AdvisorApiResponse>(`/api/advisor/${userId}/refresh`, {});
            if (response.data) {
                set(state => ({
                    advisor: response.data,
                    status: { ...state.status, advisor: { loading: false, error: null } }
                }));
            }
        } catch (err) {
            console.error(`[WalletStore] Refresh advisor error:`, err);
            set(state => ({
                status: { ...state.status, advisor: { loading: false, error: 'Failed to refresh AI advisor' } }
            }));
        }
    },

    // ============================================
    // FETCH ANALYTICS
    // ============================================
    fetchAnalytics: async (userId: string) => {
        set(state => ({ status: { ...state.status, analytics: { loading: true, error: null } } }));
        try {
            console.log(`[WalletStore] Fetching analytics for ${userId}...`);
            const response = await apiGet<AnalyticsApiResponse>(`/api/wallet/${userId}/analytics`);
            console.log(`[WalletStore] Analytics response:`, response);

            if (response.data) {
                set(state => ({
                    analytics: convertAnalyticsFromPaisa(response.data),
                    status: { ...state.status, analytics: { loading: false, error: null } }
                }));
            } else {
                set(state => ({
                    status: { ...state.status, analytics: { loading: false, error: 'No analytics data returned' } }
                }));
            }
        } catch (err) {
            console.error(`[WalletStore] Fetch analytics error:`, err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
            set(state => ({
                status: { ...state.status, analytics: { loading: false, error: errorMessage } }
            }));
        }
    },

    // ============================================
    // REFRESH ALL DATA
    // ============================================
    refreshAll: async (userId: string) => {
        if (!userId || userId === 'undefined' || userId === 'null') {
            console.warn('[WalletStore] Skip refreshAll: Invalid userId', userId);
            return;
        }

        try {
            console.log(`[WalletStore] Refreshing all data for ${userId}...`);

            // Phase 1: Fetch critical data first (wallet + ledger)
            const criticalResults = await Promise.allSettled([
                get().fetchWallet(userId),
                get().fetchLedger(userId),
            ]);

            const criticalErrors = criticalResults
                .filter(r => r.status === 'rejected')
                .map(r => (r as PromiseRejectedResult).reason);

            if (criticalErrors.length > 0) {
                console.error('[WalletStore] Critical data fetch failed:', criticalErrors);
            }

            // Phase 2: Fetch secondary data (Real-time Advisor Refresh!)
            await new Promise(resolve => setTimeout(resolve, 100));

            await Promise.allSettled([
                get().fetchFDs(userId),
                get().refreshAdvisor(userId), // Real AI refresh
                get().fetchAnalytics(userId),
            ]);

            console.log(`[WalletStore] Data refresh completed for ${userId}`);
        } catch (err) {
            console.error('[WalletStore] Data refresh orchestration error:', err);
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
            status: {
                wallet: initialStatus,
                ledger: initialStatus,
                fds: initialStatus,
                advisor: initialStatus,
                analytics: initialStatus,
            },
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
