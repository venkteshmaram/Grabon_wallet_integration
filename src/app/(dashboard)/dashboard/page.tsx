// ============================================
// DASHBOARD PAGE - Main Dashboard with 5 Sections
// Serves as the primary entry point after login
// ============================================

'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';
import { useWallet } from '@/hooks/use-wallet';
import { useTransactions } from '@/hooks/use-transactions';
import { useFdPortfolio } from '@/hooks/use-fd-portfolio';
import { useAdvisor } from '@/hooks/use-advisor';
import { useAnalytics } from '@/hooks/use-analytics';
import { BalanceCard } from '@/components/features/wallet';
import { AdvisorCard } from '@/components/features/advisor';
import { TransactionTimeline } from '@/components/features/wallet';
import { FDPortfolio } from '@/components/features/fd';
import { DonutChart, BarChart, TopMerchants } from '@/components/features/analytics';

type TransactionFilter = 'ALL' | 'CREDITS' | 'SPENDS' | 'FD' | 'FLAGGED';

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, userId, userName } = useAuthStore();
    const { wallet, advisor: advisorDataStore } = useWalletStore();

    const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('ALL');

    // Data fetching using custom hooks
    const { isLoading: walletLoading, error: walletError } = useWallet(userId || '');
    const { transactions, isLoading: transactionsLoading } = useTransactions({
        userId: userId || '',
        filter: transactionFilter,
        page: 1,
        pageSize: 50,
    });
    const { fds: fdData, isLoading: fdsLoading, breakFD } = useFdPortfolio(userId || '');
    const { advisor: advisorData, isLoading: advisorLoading, isRefreshing, refresh } = useAdvisor(userId || '');
    const { analytics: analyticsData, isLoading: analyticsLoading } = useAnalytics(userId || '');

    // Wrap breakFD to match expected type
    const handleBreakFD = useCallback(async (fdId: string): Promise<void> => {
        await breakFD(fdId);
    }, [breakFD]);

    // Get last 10 transactions
    const last10Transactions = useMemo(() => {
        return transactions.slice(0, 10);
    }, [transactions]);

    // Handle view all transactions
    const handleViewAllTransactions = useCallback(() => {
        router.push('/wallet/transactions');
    }, [router]);

    // This page is protected by the DashboardLayout AuthGuard, 
    // but we keep a local check to be safe during transitions.
    if (!isAuthenticated) return null;

    return (
        <div className="mx-auto max-w-[1200px] space-y-6 pb-8">
            {/* Welcome Header */}
            <div className="mb-6 text-center sm:text-left">
                <h1 className="text-4xl font-black text-[var(--text-primary)] mb-1 tracking-tight">
                    Welcome back, <span className="text-gold shadow-[0_0_15px_rgba(163,230,53,0.3)]">{userName || 'User'}</span>
                </h1>
                <p className="text-[var(--text-secondary)]">
                    Here's a quick summary of your account
                </p>
            </div>

            {/* Main Grid: Balance & Advisor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 1: Balance Card */}
                <section className="h-full">
                    <BalanceCard
                        wallet={wallet}
                        accountAge="Member"
                        isLoading={walletLoading}
                        error={walletError}
                        onRetry={() => window.location.reload()}
                    />
                </section>

                {/* Section 2: Claude Advisor Card */}
                <section className="h-full">
                    <AdvisorCard
                        advisor={advisorData || advisorDataStore}
                        isLoading={advisorLoading}
                        isRefreshing={isRefreshing}
                        error={null}
                        onRefresh={refresh}
                    />
                </section>
            </div>

            {/* Quick Actions / Next Steps */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                    onClick={() => router.push('/merchants')}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/50 bg-[rgba(15,15,15,0.7)] backdrop-blur-xl hover:border-gold/50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm text-[var(--text-primary)]">Pay Merchant</span>
                    <span className="text-xs text-[var(--text-secondary)] mt-1">Earn instant cashback</span>
                </button>

                <button
                    onClick={() => router.push('/wallet')}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/50 bg-[rgba(15,15,15,0.7)] backdrop-blur-xl hover:border-gold/50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm text-[var(--text-primary)]">View Wallet</span>
                    <span className="text-xs text-[var(--text-secondary)] mt-1">Check spend analytics</span>
                </button>

                <button
                    onClick={() => router.push('/wallet/invest')}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/50 bg-[rgba(15,15,15,0.7)] backdrop-blur-xl hover:border-gold/50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm text-[var(--text-primary)]">Invest in FD</span>
                    <span className="text-xs text-[var(--text-secondary)] mt-1">Earn 7.5% interest</span>
                </button>
            </section>

            {/* Recent Activity Mini-Timeline */}
            <section className="rounded-2xl border border-zinc-800/50 bg-[rgba(15,15,15,0.7)] backdrop-blur-xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-gold rounded-full" />
                        Recent Activity
                    </h2>
                    <button
                        onClick={() => router.push('/wallet/transactions')}
                        className="text-sm font-medium text-gold hover:underline"
                    >
                        View All
                    </button>
                </div>

                <div className="min-h-[150px]">
                    <TransactionTimeline
                        transactions={last10Transactions.slice(0, 5)}
                        isLoading={transactionsLoading}
                        filter={transactionFilter}
                        onFilterChange={setTransactionFilter}
                        maxItems={5}
                        showViewAll={false}
                        showFilters={false}
                    />
                </div>
            </section>
        </div>
    );
}
