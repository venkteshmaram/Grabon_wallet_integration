// ============================================
// ANALYTICS PAGE - Full Analytics Dashboard
// Step 14: Analytics Page - Production Grade
// ============================================

'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAnalytics } from '@/hooks/use-analytics';
import { DonutChart, BarChart, TopMerchants } from '@/components/features/analytics';
import { BarChart3, TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
}

function calculateAvgPerMonth(totalEarned: number, monthsActive: number): number {
    if (monthsActive === 0) return 0;
    return totalEarned / monthsActive;
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Stat Card Component
 */
interface StatCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps): React.ReactElement {
    return (
        <div
            className="rounded-xl p-4 transition-all-fast"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--bg-border)',
                borderTop: `2px solid ${color}`,
            }}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-[var(--text-secondary)]">{label}</span>
                <span style={{ color }}>{icon}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>
                {value}
            </p>
        </div>
    );
}

/**
 * Stat Card Skeleton
 */
function StatCardSkeleton(): React.ReactElement {
    return (
        <div
            className="rounded-xl p-4 animate-pulse"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--bg-border)',
            }}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton w-4 h-4 rounded" />
            </div>
            <div className="skeleton h-8 w-24 rounded" />
        </div>
    );
}

/**
 * Chart Section Wrapper
 */
interface ChartSectionProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

function ChartSection({ title, subtitle, children }: ChartSectionProps): React.ReactElement {
    return (
        <div
            className="rounded-xl p-5"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--bg-border)',
            }}
        >
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                {title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
                {subtitle}
            </p>
            {children}
        </div>
    );
}

/**
 * Chart Section Skeleton
 */
function ChartSectionSkeleton({ title, subtitle }: { title: string; subtitle: string }): React.ReactElement {
    return (
        <div
            className="rounded-xl p-5 animate-pulse"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--bg-border)',
            }}
        >
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                {title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
                {subtitle}
            </p>
            <div className="skeleton h-64 w-full rounded" />
        </div>
    );
}

// ============================================
// MAIN ANALYTICS PAGE
// ============================================

export default function AnalyticsPage(): React.ReactElement {
    const { userId } = useAuthStore();
    const { analytics, isLoading, error } = useAnalytics(userId || '');

    // Calculate stats
    const totalEarned = analytics?.savingsRate?.lifetimeEarnedRupees ?? 0;
    const totalSpent = analytics?.savingsRate?.totalSpentRupees ?? 0;
    const savingsRate = analytics?.savingsRate?.percentage ?? 0;

    // Calculate months active (default to 6 months if no data)
    const monthsActive = analytics?.monthlyTrend?.length || 6;
    const avgPerMonth = calculateAvgPerMonth(totalEarned, monthsActive);

    // Handle error state
    if (error) {
        return (
            <div className="mx-auto max-w-[1200px]">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Analytics
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Your financial insights and trends
                    </p>
                </div>
                <div
                    className="rounded-xl p-8 text-center"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
                >
                    <p className="text-[var(--text-secondary)] mb-4">
                        Failed to load analytics data
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)]">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1200px] pb-8">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--gold-muted)' }}
                    >
                        <BarChart3 className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Analytics
                    </h1>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                    Your financial insights and trends
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Total Earned"
                            value={formatCurrency(totalEarned)}
                            icon={<TrendingUp className="w-4 h-4" />}
                            color="var(--gold)"
                        />
                        <StatCard
                            label="Total Spent"
                            value={formatCurrency(totalSpent)}
                            icon={<TrendingDown className="w-4 h-4" />}
                            color="var(--red)"
                        />
                        <StatCard
                            label="Savings Rate"
                            value={`${savingsRate.toFixed(1)}%`}
                            icon={<PiggyBank className="w-4 h-4" />}
                            color="var(--green)"
                        />
                        <StatCard
                            label="Avg per Month"
                            value={formatCurrency(avgPerMonth)}
                            icon={<Wallet className="w-4 h-4" />}
                            color="var(--blue)"
                        />
                    </>
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Donut Chart - Category Breakdown */}
                {isLoading ? (
                    <ChartSectionSkeleton
                        title="Spending by Category"
                        subtitle="Breakdown of your expenses"
                    />
                ) : (
                    <ChartSection
                        title="Spending by Category"
                        subtitle="Breakdown of your expenses"
                    >
                        <DonutChart
                            data={analytics?.categoryBreakdown || []}
                            totalCashback={analytics?.savingsRate?.lifetimeEarnedRupees || 0}
                            isLoading={isLoading}
                        />
                    </ChartSection>
                )}

                {/* Bar Chart - Monthly Trend */}
                {isLoading ? (
                    <ChartSectionSkeleton
                        title="Monthly Trend"
                        subtitle="Earnings vs Spending over time"
                    />
                ) : (
                    <ChartSection
                        title="Monthly Trend"
                        subtitle="Earnings vs Spending over time"
                    >
                        <BarChart
                            data={analytics?.monthlyTrend || []}
                            isLoading={isLoading}
                        />
                    </ChartSection>
                )}
            </div>

            {/* Top Merchants - Full Width */}
            <div>
                {isLoading ? (
                    <ChartSectionSkeleton
                        title="Top Merchants"
                        subtitle="Merchants with highest cashback"
                    />
                ) : (
                    <ChartSection
                        title="Top Merchants"
                        subtitle="Merchants with highest cashback"
                    >
                        <TopMerchants
                            merchants={analytics?.topMerchants || []}
                            isLoading={isLoading}
                        />
                    </ChartSection>
                )}
            </div>
        </div>
    );
}
