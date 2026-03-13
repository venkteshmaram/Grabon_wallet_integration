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
import { BalanceCard } from '@/components/features/wallet';
import { TransactionTimeline } from '@/components/features/wallet';
import { Landmark, Plus, Store, ArrowRight, Wallet, TrendingUp, Clock } from 'lucide-react';

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
    const baseStyles = 'flex flex-col items-start p-5 rounded-xl border transition-all-fast cursor-pointer group';

    const variantStyles = {
        primary: {
            backgroundColor: 'var(--gold-muted)',
            borderColor: 'var(--gold-border)',
        },
        secondary: {
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border)',
        },
        default: {
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border)',
        },
    };

    const iconColors = {
        primary: 'var(--gold)',
        secondary: 'var(--green)',
        default: 'var(--blue)',
    };

    return (
        <button
            className={baseStyles}
            style={variantStyles[variant]}
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = variantStyles[variant].borderColor;
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors-fast"
                style={{
                    backgroundColor: variant === 'primary' ? 'var(--gold)' : 'var(--bg-primary)',
                    color: variant === 'primary' ? 'var(--text-inverse)' : iconColors[variant],
                }}
            >
                {icon}
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] text-left">
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
                <div className="flex items-center gap-3 mb-4">
                    <div className="skeleton w-10 h-10 rounded-lg" />
                    <div className="skeleton h-4 w-32 rounded" />
                </div>
                <div className="skeleton h-8 w-24 rounded mb-2" />
                <div className="skeleton h-4 w-48 rounded" />
            </div>
        );
    }

    const hasFDs = activeFdCount > 0;

    return (
        <div
            className="rounded-xl p-6 transition-all-fast"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--bg-border)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                            backgroundColor: hasFDs ? 'var(--gold-muted)' : 'var(--bg-primary)',
                            color: hasFDs ? 'var(--gold)' : 'var(--text-secondary)',
                        }}
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
                    className="flex items-center gap-1 text-xs font-medium transition-colors-fast"
                    style={{ color: 'var(--gold)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--gold)'; }}
                >
                    Invest
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {hasFDs ? (
                <div className="space-y-3">
                    <div>
                        <p className="text-xs text-[var(--text-secondary)] mb-1">Total Locked</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
                            {formatCurrency(totalLockedAmount)}
                        </p>
                    </div>
                    <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--text-secondary)' }}
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
                        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors-fast"
                        style={{
                            backgroundColor: 'var(--gold)',
                            color: 'var(--text-inverse)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--gold-hover)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--gold)';
                        }}
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
    const { isAuthenticated, userId, userName } = useAuthStore();
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
        // For demo - this would typically open a modal or navigate to a page
        // For now, we'll navigate to fund page
        router.push('/wallet/fund');
    }, [router]);

    const handlePayMerchant = useCallback(() => {
        router.push('/checkout');
    }, [router]);

    const handleInvest = useCallback(() => {
        router.push('/wallet/invest');
    }, [router]);

    const handleViewHistory = useCallback(() => {
        router.push('/wallet/transactions');
    }, [router]);

    const handleViewAllTransactions = useCallback(() => {
        router.push('/wallet/transactions');
    }, [router]);

    // Auth guard
    if (!isAuthenticated) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--gold)] border-t-transparent" />
                    <span className="text-sm text-[var(--text-secondary)]">Checking authentication...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1200px] space-y-6 pb-8">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    My Wallet
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    Manage your balance, investments, and transactions
                </p>
            </div>

            {/* Balance Card */}
            <section>
                <BalanceCard
                    wallet={wallet}
                    accountAge="Member"
                    isLoading={walletLoading}
                    error={walletError}
                    onRetry={refetchWallet}
                />
            </section>

            {/* Quick Actions Grid */}
            <section>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        description="Make a payment at partnered stores"
                        onClick={handlePayMerchant}
                        variant="primary"
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
                        title="View History"
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
                    <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] overflow-hidden">
                        <div className="p-4 border-b border-[var(--bg-border)]">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
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
