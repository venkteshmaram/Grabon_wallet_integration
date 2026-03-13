// ============================================
// FD PORTFOLIO COMPONENT - Investment Portfolio Grid
// Step 8: Investment Portfolio Components
// ============================================

'use client';

import React, { useMemo } from 'react';
import { Landmark, ArrowRight } from 'lucide-react';
import { FDCard } from './fd-card';
import type { FDRecord } from '@/store/wallet-store';

// ============================================
// TYPES
// ============================================

interface FDPortfolioProps {
    /** Array of FD records */
    fds: FDRecord[];
    /** Loading state for fetch operations */
    isLoading: boolean;
    /** Callback when user breaks an FD */
    onBreakFD: (fdId: string) => Promise<void>;
    /** Whether break operation is in progress */
    isBreaking?: boolean;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format amount in rupees with ₹ symbol
 */
function formatRupees(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ============================================
// LOADING SKELETON COMPONENT
// ============================================

function PortfolioSkeleton(): React.ReactElement {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
                <div
                    key={i}
                    className="animate-shimmer rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-5"
                >
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="h-5 w-24 rounded bg-[var(--bg-border)]" />
                        <div className="h-6 w-16 rounded-full bg-[var(--bg-border)]" />
                    </div>

                    {/* Amount */}
                    <div className="mb-1 h-8 w-32 rounded bg-[var(--bg-border)]" />
                    <div className="mb-3 h-5 w-20 rounded bg-[var(--bg-border)]" />

                    {/* Info rows */}
                    <div className="mb-2 h-4 w-full rounded bg-[var(--bg-border)]" />
                    <div className="mb-1 h-4 w-3/4 rounded bg-[var(--bg-border)]" />
                    <div className="mb-4 h-4 w-1/2 rounded bg-[var(--bg-border)]" />

                    {/* Progress bar */}
                    <div className="mb-4">
                        <div className="mb-1 flex justify-between">
                            <div className="h-3 w-12 rounded bg-[var(--bg-border)]" />
                            <div className="h-3 w-8 rounded bg-[var(--bg-border)]" />
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--bg-border)]" />
                    </div>

                    {/* Button */}
                    <div className="h-10 w-full rounded-lg bg-[var(--bg-border)]" />
                </div>
            ))}
        </div>
    );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

function EmptyState(): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-primary)]">
                <Landmark className="h-8 w-8 text-[var(--text-disabled)]" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
                No active investments
            </h3>
            <p className="mb-6 max-w-xs text-center text-sm text-[var(--text-secondary)]">
                Start growing your savings with fixed deposits and earn up to 7.5% interest p.a.
            </p>
            <a
                href="/wallet/invest"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--bg-primary)] transition-colors hover:bg-[var(--gold-hover)]"
            >
                Start Investing
                <ArrowRight className="h-4 w-4" />
            </a>
        </div>
    );
}

// ============================================
// MAIN PORTFOLIO COMPONENT
// ============================================

export function FDPortfolio({
    fds,
    isLoading,
    onBreakFD,
    isBreaking = false,
}: FDPortfolioProps): React.ReactElement {
    // Calculate total portfolio value
    const totalPortfolioValue = useMemo(() => {
        return fds.reduce((sum, fd) => sum + fd.maturityAmount, 0);
    }, [fds]);

    // Calculate active FDs value
    const activeValue = useMemo(() => {
        return fds
            .filter((fd) => fd.status === 'ACTIVE')
            .reduce((sum, fd) => sum + fd.principal, 0);
    }, [fds]);

    // Loading state
    if (isLoading) {
        return (
            <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="h-6 w-40 rounded bg-[var(--bg-border)]" />
                    <div className="h-6 w-24 rounded bg-[var(--bg-border)]" />
                </div>
                <PortfolioSkeleton />
            </div>
        ) as React.ReactElement;
    }

    // Empty state
    if (fds.length === 0) {
        return (
            <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Investment Portfolio
                    </h2>
                </div>
                <EmptyState />
            </div>
        ) as React.ReactElement;
    }

    return (
        <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6">
            {/* Header Row */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    Investment Portfolio
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)]">
                        Total Value:
                    </span>
                    <span className="text-xl font-bold text-[var(--gold)]">
                        {formatRupees(totalPortfolioValue)}
                    </span>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                    <div className="mb-1 text-xs text-[var(--text-secondary)]">
                        Active FDs
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                        {fds.filter((fd) => fd.status === 'ACTIVE').length}
                    </div>
                </div>
                <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                    <div className="mb-1 text-xs text-[var(--text-secondary)]">
                        Amount Invested
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                        {formatRupees(activeValue)}
                    </div>
                </div>
                <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                    <div className="mb-1 text-xs text-[var(--text-secondary)]">
                        Matured
                    </div>
                    <div className="text-lg font-bold text-[var(--green)]">
                        {fds.filter((fd) => fd.status === 'MATURED').length}
                    </div>
                </div>
                <div className="rounded-lg bg-[var(--bg-primary)] p-4">
                    <div className="mb-1 text-xs text-[var(--text-secondary)]">
                        Broken
                    </div>
                    <div className="text-lg font-bold text-[var(--red)]">
                        {fds.filter((fd) => fd.status === 'BROKEN').length}
                    </div>
                </div>
            </div>

            {/* FD Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fds.map((fd) => (
                    <FDCard
                        key={fd.id}
                        fd={fd}
                        onBreak={onBreakFD}
                        isBreaking={isBreaking}
                    />
                ))}
            </div>
        </div>
    );
}

// Export types
export type { FDPortfolioProps };
