// ============================================
// WALLET PAGE - Wallet Overview with Quick Actions
// Step 12: Wallet Pages - Production Grade
// ============================================

'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';
import { useWallet } from '@/hooks/use-wallet';
import { useTransactions } from '@/hooks/use-transactions';
import { useFdPortfolio } from '@/hooks/use-fd-portfolio';
import { useAnalytics } from '@/hooks/use-analytics';
import { BalanceCard } from '@/components/features/wallet';
import { TransactionTimeline } from '@/components/features/wallet';
import { DonutChart, BarChart } from '@/components/features/analytics';
import { Landmark, Plus, Store, ArrowRight, Wallet, TrendingUp, Clock, Gift } from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

// ============================================
// TYPES
// ============================================

interface QuickActionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'default';
}

interface FDSummaryCardProps {
    activeFdCount: number;
    totalLockedAmount: number;
    isLoading: boolean;
    onInvestClick: () => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Quick Action Card Component
 */
function QuickActionCard({ icon, title, description, onClick, variant = 'default' }: QuickActionCardProps): React.ReactElement {
    return (
        <button
            className="flex flex-col items-start p-6 rounded-2xl border transition-all-slow cursor-pointer backdrop-blur-md hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] group relative overflow-hidden h-full w-full"
            style={{
                backgroundColor: variant === 'primary' ? 'rgba(163, 230, 53, 0.05)' : 'rgba(15, 15, 15, 0.5)',
                borderColor: variant === 'primary' ? 'rgba(163, 230, 53, 0.3)' : 'rgba(255, 255, 255, 0.05)',
            }}
            onClick={onClick}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 shadow-lg"
                style={{
                    backgroundColor: variant === 'primary' ? 'var(--gold)' : 'rgba(255, 255, 255, 0.03)',
                    color: variant === 'primary' ? 'var(--text-inverse)' : 'var(--gold)',
                }}
            >
                {icon}
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 uppercase tracking-tight">
                {title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] text-left leading-relaxed">
                {description}
            </p>
        </button>
    );
}

/**
 * FD Summary Card Component
 */
function FDSummaryCard({ activeFdCount, totalLockedAmount, isLoading, onInvestClick }: FDSummaryCardProps): React.ReactElement {
    if (isLoading) {
        return (
            <div
                className="rounded-xl p-6 animate-pulse"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
            >
                <div className="skeleton h-24 w-full rounded-lg" />
            </div>
        );
    }

    const hasFDs = activeFdCount > 0;

    return (
        <div
            className="rounded-2xl p-6 transition-all-slow backdrop-blur-xl border border-zinc-800/50 shadow-2xl h-full"
            style={{
                backgroundColor: 'rgba(15, 15, 15, 0.7)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center bg-gold/10 text-gold"
                    >
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            GrabSave FDs
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {hasFDs ? `${activeFdCount} Active FD${activeFdCount > 1 ? 's' : ''}` : 'No active FDs'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onInvestClick}
                    className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-hover transition-colors"
                >
                    Invest
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {hasFDs ? (
                <div className="space-y-3">
                    <div>
                        <p className="text-xs text-[var(--text-secondary)] mb-1">Total Locked</p>
                        <p className="text-2xl font-bold text-gold">
                            {formatCurrency(totalLockedAmount)}
                        </p>
                    </div>
                    <div
                        className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                    >
                        <Clock className="w-3 h-3" />
                        <span>Earning 7.5% p.a. interest</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Start earning 7.5% p.a. with GrabSave FDs
                    </p>
                    <button
                        onClick={onInvestClick}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-gold text-white hover:bg-gold-hover transition-colors"
                    >
                        Create Your First FD
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================================
// MAIN WALLET PAGE
// ============================================

export default function WalletPage(): React.ReactElement {
    const router = useRouter();
    const { isAuthenticated, userId } = useAuthStore();
    const { wallet } = useWalletStore();

    // Load wallet data
    const { isLoading: walletLoading, error: walletError, refetch: refetchWallet } = useWallet(userId || '');

    // Load recent transactions (last 5)
    const { transactions, isLoading: transactionsLoading } = useTransactions({
        userId: userId || '',
        page: 1,
        pageSize: 5,
    });

    // Load FD portfolio
    const { fds, isLoading: fdsLoading } = useFdPortfolio(userId || '');

    // Load Analytics data
    const { analytics: analyticsData, isLoading: analyticsLoading } = useAnalytics(userId || '');

    // Calculate FD summary
    const fdSummary = useMemo(() => {
        const activeFds = fds.filter(fd => fd.status === 'ACTIVE');
        return {
            count: activeFds.length,
            totalLocked: activeFds.reduce((sum, fd) => sum + fd.principal, 0),
        };
    }, [fds]);

    // Navigation handlers
    const handleAddCashback = useCallback(() => {
        router.push('/wallet/fund');
    }, [router]);

    const handlePayMerchant = useCallback(() => {
        router.push('/merchants');
    }, [router]);

    const handleInvest = useCallback(() => {
        router.push('/wallet/invest');
    }, [router]);

    const handleViewHistory = useCallback(() => {
        router.push('/wallet/transactions');
    }, [router]);

    const handleCashbackTracker = useCallback(() => {
        router.push('/wallet/cashback');
    }, [router]);

    const handleViewAllTransactions = useCallback(() => {
        router.push('/wallet/transactions');
    }, [router]);

    // Auth guard
    if (!isAuthenticated) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent" />
                    <span className="text-sm text-[var(--text-secondary)]">Checking authentication...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1200px] space-y-6 pb-8">
            {/* Page Header */}
            <div className="mb-10 text-center sm:text-left pt-2">
                <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
                    My Wallet
                </h1>
                <p className="text-[var(--text-secondary)] font-medium">
                    Manage your balance, investments, and transactions
                </p>
            </div>

            {/* Balance Card Section */}
            <section>
                <BalanceCard
                    wallet={wallet}
                    accountAge="Member"
                    isLoading={walletLoading}
                    error={walletError}
                    onRetry={refetchWallet}
                />
            </section>

            {/* Spend Analytics Section */}
            <section className="rounded-2xl border border-zinc-800/50 bg-[rgba(15,15,15,0.7)] backdrop-blur-xl p-8 shadow-2xl">
                <h2 className="mb-8 text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-gold rounded-full" />
                    Spend Analytics
                </h2>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Donut Chart */}
                    <div className="rounded-xl bg-black/40 border border-zinc-800/30 p-6 transition-all hover:border-zinc-700/50">
                        <h3 className="mb-6 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Spending by Category
                        </h3>
                        <DonutChart
                            data={analyticsData?.categoryBreakdown || []}
                            totalCashback={analyticsData?.savingsRate?.lifetimeEarnedRupees || 0}
                            isLoading={analyticsLoading}
                        />
                    </div>
    
                    {/* Bar Chart */}
                    <div className="rounded-xl bg-black/40 border border-zinc-800/30 p-6 transition-all hover:border-zinc-700/50">
                        <h3 className="mb-6 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Monthly Trend
                        </h3>
                        <BarChart
                            data={analyticsData?.monthlyTrend || []}
                            isLoading={analyticsLoading}
                        />
                    </div>
                </div>
            </section>

            {/* Quick Actions Grid */}
            <section>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <QuickActionCard
                        icon={<Plus className="w-5 h-5" />}
                        title="Add Cashback"
                        description="Credit demo cashback to your wallet"
                        onClick={handleAddCashback}
                        variant="secondary"
                    />
                    <QuickActionCard
                        icon={<Store className="w-5 h-5" />}
                        title="Pay Merchant"
                        description="Experience seamless merchant payments"
                        onClick={handlePayMerchant}
                        variant="primary"
                    />
                    <QuickActionCard
                        icon={<Gift className="w-5 h-5" />}
                        title="Cashback"
                        description="Track pending & settled cashback"
                        onClick={handleCashbackTracker}
                        variant="default"
                    />
                    <QuickActionCard
                        icon={<TrendingUp className="w-5 h-5" />}
                        title="Invest"
                        description="Create a GrabSave FD at 7.5% p.a."
                        onClick={handleInvest}
                        variant="default"
                    />
                    <QuickActionCard
                        icon={<Wallet className="w-5 h-5" />}
                        title="History"
                        description="See all your transactions"
                        onClick={handleViewHistory}
                        variant="default"
                    />
                </div>
            </section>

            {/* Recent Transactions & FD Summary */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-zinc-800/50 bg-[rgba(15,15,15,0.7)] backdrop-blur-xl overflow-hidden shadow-2xl transition-all hover:border-zinc-700/50">
                        <div className="p-6 border-b border-zinc-800/30">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-gold rounded-full" />
                                Recent Transactions
                            </h2>
                        </div>
                        <TransactionTimeline
                            transactions={transactions}
                            isLoading={transactionsLoading}
                            filter="ALL"
                            onFilterChange={() => { }}
                            showFilters={false}
                            maxItems={5}
                            showViewAll={true}
                            onViewAll={handleViewAllTransactions}
                        />
                    </div>
                </div>

                {/* FD Summary */}
                <div className="lg:col-span-1">
                    <FDSummaryCard
                        activeFdCount={fdSummary.count}
                        totalLockedAmount={fdSummary.totalLocked}
                        isLoading={fdsLoading}
                        onInvestClick={handleInvest}
                    />
                </div>
            </section>
        </div>
    );
}
