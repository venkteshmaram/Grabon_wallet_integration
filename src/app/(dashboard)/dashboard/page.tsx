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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    Welcome back, {userName || 'User'}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    Here's your financial overview
                </p>
            </div>

            {/* Section 1: Balance Card */}
            <section>
                <BalanceCard
                    wallet={wallet}
                    accountAge="Member"
                    isLoading={walletLoading}
                    error={walletError}
                    onRetry={() => window.location.reload()}
                />
            </section>

            {/* Section 2: Claude Advisor Card */}
            <section>
                <AdvisorCard
                    advisor={advisorData || advisorDataStore}
                    isLoading={advisorLoading}
                    isRefreshing={isRefreshing}
                    error={null}
                    onRefresh={refresh}
                />
            </section>

            {/* Section 3: Transaction Timeline */}
            <section>
                <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
                        Recent Transactions
                    </h2>
                    <div className="min-h-[200px]">
                        <TransactionTimeline
                            transactions={last10Transactions}
                            isLoading={transactionsLoading}
                            filter={transactionFilter}
                            onFilterChange={setTransactionFilter}
                            maxItems={10}
                            showViewAll={true}
                            onViewAll={handleViewAllTransactions}
                        />
                    </div>
                </div>
            </section>

            {/* Section 4: Investment Portfolio */}
            <section>
                <FDPortfolio
                    fds={fdData}
                    isLoading={fdsLoading}
                    onBreakFD={handleBreakFD}
                    isBreaking={false}
                />
            </section>

            {/* Section 5: Spend Analytics */}
            <section>
                <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6">
                    <h2 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">
                        Spend Analytics
                    </h2>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Donut Chart */}
                        <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                            <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">
                                Spending by Category
                            </h3>
                            <DonutChart
                                data={analyticsData?.categoryBreakdown || []}
                                totalCashback={analyticsData?.savingsRate?.lifetimeEarnedRupees || 0}
                                isLoading={analyticsLoading}
                            />
                        </div>

                        {/* Bar Chart */}
                        <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                            <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">
                                Monthly Trend
                            </h3>
                            <BarChart
                                data={analyticsData?.monthlyTrend || []}
                                isLoading={analyticsLoading}
                            />
                        </div>

                        {/* Top Merchants - Full Width */}
                        <div className="rounded-lg bg-[var(--bg-primary)] p-4 lg:col-span-2">
                            <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">
                                Top Merchants
                            </h3>
                            <TopMerchants
                                merchants={analyticsData?.topMerchants || []}
                                isLoading={analyticsLoading}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
