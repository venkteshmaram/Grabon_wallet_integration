// ============================================
// TRANSACTION TIMELINE COMPONENT
// Step 7: Transaction Timeline - Production Grade
// ============================================

'use client';

import React, { useMemo, useCallback } from 'react';
import {
    ArrowUpRight,
    ArrowDownRight,
    Landmark,
    AlertTriangle,
    Wallet,
} from 'lucide-react';
import type { LedgerEntry } from '@/store/wallet-store';

// ============================================
// TYPES
// ============================================

type TransactionFilter = 'ALL' | 'CREDITS' | 'SPENDS' | 'FD' | 'FLAGGED';

interface TransactionTimelineProps {
    /** Array of transaction entries */
    transactions: LedgerEntry[];
    /** Loading state */
    isLoading: boolean;
    /** Current filter value */
    filter: TransactionFilter;
    /** Filter change callback */
    onFilterChange: (filter: TransactionFilter) => void;
    /** Maximum items to display (default: all) */
    maxItems?: number;
    /** Show "View All" button */
    showViewAll?: boolean;
    /** View All click callback */
    onViewAll?: () => void;
    /** Whether to show filter tabs inside this component */
    showFilters?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const FILTERS: { value: TransactionFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'CREDITS', label: 'Credits' },
    { value: 'SPENDS', label: 'Spends' },
    { value: 'FD', label: 'FD' },
    { value: 'FLAGGED', label: 'Flagged' },
];

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
 * Format relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Get transaction icon configuration based on type and flag status
 */
function getTransactionIconConfig(entry: LedgerEntry): {
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
} {
    // Flagged transactions take precedence
    if (entry.isFlagged) {
        return {
            icon: <AlertTriangle className="w-4 h-4" />,
            bgColor: 'var(--orange-muted)',
            iconColor: 'var(--orange)',
        };
    }

    // Credit transactions
    if (
        entry.type === 'CASHBACK_CREDIT' ||
        entry.type === 'CASHBACK_SETTLEMENT' ||
        entry.type === 'FD_UNLOCK' ||
        entry.type === 'FD_INTEREST'
    ) {
        return {
            icon: <ArrowUpRight className="w-4 h-4" />,
            bgColor: 'var(--green-muted)',
            iconColor: 'var(--green)',
        };
    }

    // FD Lock (blue)
    if (entry.type === 'FD_LOCK') {
        return {
            icon: <Landmark className="w-4 h-4" />,
            bgColor: 'var(--blue-muted)',
            iconColor: 'var(--blue)',
        };
    }

    // Debit transactions (default)
    return {
        icon: <ArrowDownRight className="w-4 h-4" />,
        bgColor: 'var(--red-muted)',
        iconColor: 'var(--red)',
    };
}

/**
 * Get amount display configuration
 */
function getAmountConfig(entry: LedgerEntry): {
    prefix: string;
    color: string;
} {
    // Credits
    if (
        entry.type === 'CASHBACK_CREDIT' ||
        entry.type === 'CASHBACK_SETTLEMENT' ||
        entry.type === 'FD_INTEREST'
    ) {
        return { prefix: '+', color: 'var(--green)' };
    }

    // FD Unlock (blue +)
    if (entry.type === 'FD_UNLOCK') {
        return { prefix: '+', color: 'var(--blue)' };
    }

    // FD Lock (blue -)
    if (entry.type === 'FD_LOCK') {
        return { prefix: '-', color: 'var(--blue)' };
    }

    // Debits (default)
    return { prefix: '-', color: 'var(--red)' };
}

/**
 * Get status badge configuration
 */
function getStatusBadgeConfig(status: string): {
    bgColor: string;
    textColor: string;
    label: string;
} {
    switch (status) {
        case 'PENDING':
            return {
                bgColor: 'var(--slate-muted)',
                textColor: 'var(--slate)',
                label: 'Pending',
            };
        case 'SETTLED':
            return {
                bgColor: 'var(--green-muted)',
                textColor: 'var(--green)',
                label: 'Settled',
            };
        case 'HELD':
            return {
                bgColor: 'var(--orange-muted)',
                textColor: 'var(--orange)',
                label: 'On Hold',
            };
        case 'FAILED':
            return {
                bgColor: 'var(--red-muted)',
                textColor: 'var(--red)',
                label: 'Failed',
            };
        default:
            return {
                bgColor: 'var(--slate-muted)',
                textColor: 'var(--slate)',
                label: status,
            };
    }
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Filter Tab Component
 */
interface FilterTabProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

function FilterTab({ label, isActive, onClick }: FilterTabProps): React.ReactElement {
    return (
        <button
            onClick={onClick}
            className="relative px-4 py-3 text-sm font-medium transition-colors-fast"
            style={{
                color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }
            }}
        >
            {label}
            {isActive && (
                <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: 'var(--gold)' }}
                />
            )}
        </button>
    );
}

/**
 * Transaction Entry Component
 */
interface TransactionEntryProps {
    entry: LedgerEntry;
}

function TransactionEntry({ entry }: TransactionEntryProps): React.ReactElement {
    const iconConfig = getTransactionIconConfig(entry);
    const amountConfig = getAmountConfig(entry);
    const statusConfig = getStatusBadgeConfig(entry.status);
    const timeAgo = formatTimeAgo(entry.createdAt);

    const isPending = entry.status === 'PENDING';

    return (
        <div
            className={`flex items-center gap-4 p-4 border-b transition-colors-fast ${isPending ? 'animate-pulse' : ''
                }`}
            style={{
                borderColor: 'var(--bg-border)',
                borderLeft: entry.isFlagged ? '3px solid #F97316' : 'none',
                opacity: isPending ? 0.85 : 1,
            }}
        >
            {/* Icon Circle */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                    backgroundColor: iconConfig.bgColor,
                    color: iconConfig.iconColor,
                }}
            >
                {iconConfig.icon}
            </div>

            {/* Center Content */}
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {entry.merchantName || entry.description || entry.type.replace(/_/g, ' ')}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {entry.category && <span>{entry.category} · </span>}
                    <span>{timeAgo}</span>
                </p>
                {entry.isFlagged && entry.flagReason && (
                    <p
                        className="text-xs italic mt-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {entry.flagReason}
                    </p>
                )}
            </div>

            {/* Right Content - Amount & Status */}
            <div className="flex flex-col items-end gap-1">
                <p
                    className="text-sm font-semibold"
                    style={{ color: amountConfig.color }}
                >
                    {amountConfig.prefix}
                    {CURRENCY_FORMATTER.format(entry.amount)}
                </p>
                <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                        backgroundColor: statusConfig.bgColor,
                        color: statusConfig.textColor,
                    }}
                >
                    {statusConfig.label}
                </span>
            </div>
        </div>
    );
}

/**
 * Loading Skeleton for Transaction Timeline
 */
function TransactionTimelineSkeleton(): React.ReactElement {
    return (
        <div className="w-full">
            {/* Filter Tabs Skeleton */}
            <div className="flex gap-2 border-b px-4" style={{ borderColor: 'var(--bg-border)' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton h-10 w-16 rounded mb-0" />
                ))}
            </div>

            {/* Transaction Rows Skeleton */}
            <div className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                        <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                            <div className="skeleton h-4 w-32 rounded mb-2" />
                            <div className="skeleton h-3 w-24 rounded" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="skeleton h-4 w-20 rounded" />
                            <div className="skeleton h-5 w-16 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Empty State Component
 */
function EmptyState({ filter }: { filter: TransactionFilter }): React.ReactElement {
    const isFilterEmpty = filter !== 'ALL';

    return (
        <div
            className="flex flex-col items-center justify-center py-12 px-4"
            style={{ color: 'var(--text-secondary)' }}
        >
            <Wallet className="w-12 h-12 mb-4" style={{ color: 'var(--text-disabled)' }} />
            <p className="text-base font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isFilterEmpty ? 'No transactions match this filter' : 'No transactions yet'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-disabled)' }}>
                {isFilterEmpty
                    ? 'Try a different filter to see your transactions'
                    : 'Start earning cashback to see your transaction history'}
            </p>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Transaction Timeline Component
 * 
 * Displays a filterable list of transactions with color-coded icons,
 * status badges, and special styling for pending/flagged entries.
 * 
 * @example
 * ```tsx
 * <TransactionTimeline
 *   transactions={transactions}
 *   isLoading={false}
 *   filter="ALL"
 *   onFilterChange={setFilter}
 *   maxItems={10}
 *   showViewAll={true}
 *   onViewAll={() => router.push('/wallet/transactions')}
 * />
 * ```
 */
export function TransactionTimeline({
    transactions,
    isLoading,
    filter,
    onFilterChange,
    maxItems,
    showViewAll,
    onViewAll,
    showFilters = true,
}: TransactionTimelineProps): React.ReactElement {
    // Filter transactions based on current filter
    const filteredTransactions = useMemo(() => {
        if (filter === 'ALL') return transactions;

        return transactions.filter((entry) => {
            switch (filter) {
                case 'CREDITS':
                    return ['CASHBACK_CREDIT', 'CASHBACK_SETTLEMENT', 'FD_INTEREST'].includes(entry.type);
                case 'SPENDS':
                    return entry.type === 'PAYU_SPEND';
                case 'FD':
                    return ['FD_LOCK', 'FD_UNLOCK'].includes(entry.type);
                case 'FLAGGED':
                    return entry.isFlagged;
                default:
                    return true;
            }
        });
    }, [transactions, filter]);

    // Limit items if maxItems is specified
    const displayTransactions = useMemo(() => {
        if (maxItems && filteredTransactions.length > maxItems) {
            return filteredTransactions.slice(0, maxItems);
        }
        return filteredTransactions;
    }, [filteredTransactions, maxItems]);

    // Handle filter click
    const handleFilterClick = useCallback(
        (newFilter: TransactionFilter) => {
            onFilterChange(newFilter);
        },
        [onFilterChange]
    );

    // Loading state
    if (isLoading) {
        return <TransactionTimelineSkeleton />;
    }

    return (
        <div
            className="w-full rounded-[var(--radius-lg)] overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)' }}
        >
            {/* Filter Tabs */}
            {showFilters && (
                <div
                    className="flex gap-1 border-b overflow-x-auto"
                    style={{ borderColor: 'var(--bg-border)' }}
                >
                    {FILTERS.map((f) => (
                        <FilterTab
                            key={f.value}
                            label={f.label}
                            isActive={filter === f.value}
                            onClick={() => handleFilterClick(f.value)}
                        />
                    ))}
                </div>
            )}

            {/* Transaction List */}
            <div className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
                {displayTransactions.length > 0 ? (
                    displayTransactions.map((entry) => (
                        <TransactionEntry key={entry.id} entry={entry} />
                    ))
                ) : (
                    <EmptyState filter={filter} />
                )}
            </div>

            {/* View All Button */}
            {showViewAll && filteredTransactions.length > 0 && onViewAll && (
                <div
                    className="p-4 border-t text-center"
                    style={{ borderColor: 'var(--bg-border)' }}
                >
                    <button
                        onClick={onViewAll}
                        className="text-sm font-medium transition-colors-fast"
                        style={{ color: 'var(--gold)' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--gold-hover)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--gold)';
                        }}
                    >
                        View All Transactions
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================================
// EXPORTS
// ============================================

export type { TransactionTimelineProps, TransactionFilter };
export { TransactionTimelineSkeleton };
