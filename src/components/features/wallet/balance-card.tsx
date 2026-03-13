// ============================================
// BALANCE CARD COMPONENT
// Step 5: Balance Card Component - Production Grade
// ============================================

'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Lock, Sparkles, Wallet } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface WalletData {
    availableRupees: number;
    pendingRupees: number;
    lockedRupees: number;
    lifetimeEarnedRupees: number;
}

interface BalanceCardProps {
    /** Wallet data or null if loading */
    wallet: WalletData | null;
    /** Account age string (e.g., "6 months") */
    accountAge?: string;
    /** Loading state */
    isLoading: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Retry callback for error state */
    onRetry?: () => void;
    /** Earliest FD unlock date for tooltip */
    earliestUnlockDate?: string;
}

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
// UTILITY FUNCTIONS
// ============================================

/**
 * Format amount in rupees with ₹ symbol
 */
function formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Loading Skeleton for Balance Card
 */
function BalanceCardSkeleton(): React.ReactElement {
    return (
        <div
            className="w-full rounded-[var(--radius-lg)] p-6 animate-pulse"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderTop: '3px solid var(--gold)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
        >
            {/* Top Row Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="skeleton-gold h-4 w-32 rounded" />
                <div className="skeleton h-6 w-20 rounded-full" />
            </div>

            {/* Balance Section Skeleton */}
            <div className="mb-8">
                <div className="skeleton h-3 w-28 rounded mb-2" />
                <div className="skeleton-gold h-12 w-48 rounded mb-2" />
                <div className="skeleton h-3 w-36 rounded" />
            </div>

            {/* Stats Row Skeleton */}
            <div className="flex gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="skeleton h-4 w-4 rounded" />
                        <div className="skeleton h-4 w-20 rounded" />
                    </div>
                ))}
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-gold h-12 flex-1 rounded-[var(--radius-md)]" />
                ))}
            </div>
        </div>
    );
}

/**
 * Error State for Balance Card
 */
function BalanceCardError({ message, onRetry }: { message: string; onRetry?: () => void }): React.ReactElement {
    return (
        <div
            className="w-full rounded-[var(--radius-lg)] p-6"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderTop: '3px solid var(--red)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
        >
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Wallet className="w-12 h-12 mb-4" style={{ color: 'var(--red)' }} />
                <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Failed to load wallet balance
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {message}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 rounded-[var(--radius-md)] font-medium transition-colors-fast"
                        style={{
                            backgroundColor: 'transparent',
                            color: 'var(--red)',
                            border: '1px solid var(--red)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--red-muted)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Balance Stat Item Component
 */
interface BalanceStatProps {
    icon: React.ReactNode;
    label: string;
    amount: number;
    color: string;
    tooltip?: string;
}

function BalanceStat({ icon, label, amount, color, tooltip }: BalanceStatProps): React.ReactElement {
    return (
        <div className="flex items-center gap-2 group relative" title={tooltip}>
            <span style={{ color }}>{icon}</span>
            <div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                </p>
                <p className="text-lg font-semibold" style={{ color }}>
                    {formatCurrency(amount)}
                </p>
            </div>
        </div>
    );
}

/**
 * Action Button Component
 */
interface ActionButtonProps {
    children: React.ReactNode;
    variant: 'primary' | 'secondary' | 'ghost';
    onClick?: () => void;
}

function ActionButton({ children, variant, onClick }: ActionButtonProps): React.ReactElement {
    const baseStyles =
        'flex-1 h-12 rounded-[var(--radius-md)] font-semibold text-sm transition-all-fast flex items-center justify-center';

    const variantStyles = {
        primary: {
            backgroundColor: 'var(--gold)',
            color: 'var(--text-inverse)',
        },
        secondary: {
            backgroundColor: 'transparent',
            color: 'var(--gold)',
            border: '1px solid var(--gold)',
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
        },
    };

    const hoverStyles = {
        primary: { backgroundColor: 'var(--gold-hover)' },
        secondary: { backgroundColor: 'var(--gold-muted)' },
        ghost: { color: 'var(--text-primary)' },
    };

    return (
        <button
            className={baseStyles}
            style={variantStyles[variant]}
            onClick={onClick}
            onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, hoverStyles[variant]);
            }}
            onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, variantStyles[variant]);
            }}
        >
            {children}
        </button>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Balance Card Component
 * 
 * Displays wallet balance with available, pending, locked, and lifetime earned amounts.
 * Includes quick action buttons for pay, invest, and view history.
 * 
 * @example
 * ```tsx
 * <BalanceCard
 *   wallet={wallet}
 *   accountAge="6 months"
 *   isLoading={false}
 *   error={null}
 *   onRetry={refetch}
 *   earliestUnlockDate="15 Mar 2025"
 * />
 * ```
 */
export function BalanceCard({
    wallet,
    accountAge,
    isLoading,
    error,
    onRetry,
    earliestUnlockDate,
}: BalanceCardProps): React.ReactElement {
    const router = useRouter();

    // Navigation handlers
    const handlePay = useCallback(() => {
        router.push('/checkout');
    }, [router]);

    const handleInvest = useCallback(() => {
        router.push('/wallet/invest');
    }, [router]);

    const handleViewHistory = useCallback(() => {
        router.push('/wallet/transactions');
    }, [router]);

    // Loading state
    if (isLoading && !wallet) {
        return <BalanceCardSkeleton />;
    }

    // Error state
    if (error) {
        return <BalanceCardError message={error} onRetry={onRetry} />;
    }

    // Default values for null wallet
    const availableBalance = wallet?.availableRupees ?? 0;
    const pendingBalance = wallet?.pendingRupees ?? 0;
    const lockedBalance = wallet?.lockedRupees ?? 0;
    const lifetimeEarned = wallet?.lifetimeEarnedRupees ?? 0;

    return (
        <div
            className="w-full rounded-[var(--radius-lg)] p-6"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderTop: '3px solid var(--gold)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
        >
            {/* Top Row */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                    <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        GrabCash Wallet
                    </span>
                </div>
                {accountAge && (
                    <span
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-border)',
                        }}
                    >
                        {accountAge}
                    </span>
                )}
            </div>

            {/* Available Balance Section */}
            <div className="mb-8">
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Available Balance
                </p>
                <h2
                    className="text-5xl font-bold mb-1"
                    style={{ color: 'var(--green)' }}
                >
                    {formatCurrency(availableBalance)}
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Ready to spend or invest
                </p>
            </div>

            {/* Three Balance Stats Row */}
            <div className="flex flex-wrap gap-6 mb-8">
                <BalanceStat
                    icon={<Clock className="w-4 h-4" />}
                    label="Pending"
                    amount={pendingBalance}
                    color="var(--slate)"
                    tooltip="Settles in 24 hours"
                />
                <BalanceStat
                    icon={<Lock className="w-4 h-4" />}
                    label="Locked"
                    amount={lockedBalance}
                    color="var(--gold)"
                    tooltip={earliestUnlockDate ? `Earliest unlock: ${earliestUnlockDate}` : 'Locked in FDs'}
                />
                <BalanceStat
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Lifetime Earned"
                    amount={lifetimeEarned}
                    color="var(--gold)"
                    tooltip="Total cashback earned"
                />
            </div>

            {/* Three Action Buttons Row */}
            <div className="flex gap-3">
                <ActionButton variant="primary" onClick={handlePay}>
                    Pay with GrabCash
                </ActionButton>
                <ActionButton variant="secondary" onClick={handleInvest}>
                    Invest in GrabSave
                </ActionButton>
                <ActionButton variant="ghost" onClick={handleViewHistory}>
                    View History
                </ActionButton>
            </div>
        </div>
    );
}

// ============================================
// EXPORTS
// ============================================

export type { BalanceCardProps, WalletData };
export { BalanceCardSkeleton, BalanceCardError };
