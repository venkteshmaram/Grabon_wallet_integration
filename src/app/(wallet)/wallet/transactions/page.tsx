// ============================================
// TRANSACTIONS PAGE - Full Transaction History with Pagination
// Step 12: Wallet Pages - Production Grade
// ============================================

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useTransactions } from '@/hooks/use-transactions';
import { TransactionTimeline } from '@/components/features/wallet';
import { Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================
// TYPES
// ============================================

type TransactionFilter = 'ALL' | 'CREDITS' | 'SPENDS' | 'FD' | 'FLAGGED';

interface DateRange {
    from: string;
    to: string;
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

const PAGE_SIZE = 20;

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
            className="relative px-4 py-3 text-sm font-medium transition-colors-fast whitespace-nowrap"
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
 * Date Input Component
 */
interface DateInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

function DateInput({ label, value, onChange }: DateInputProps): React.ReactElement {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
                {label}
            </label>
            <div className="relative">
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm transition-colors-fast"
                    style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--bg-border)',
                        color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--gold)';
                        e.currentTarget.style.outline = 'none';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--bg-border)';
                    }}
                />
                <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--text-tertiary)' }}
                />
            </div>
        </div>
    );
}

/**
 * Pagination Component
 */
interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps): React.ReactElement | null {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    const handlePrevious = useCallback(() => {
        if (canGoPrevious) {
            onPageChange(currentPage - 1);
        }
    }, [canGoPrevious, currentPage, onPageChange]);

    const handleNext = useCallback(() => {
        if (canGoNext) {
            onPageChange(currentPage + 1);
        }
    }, [canGoNext, currentPage, onPageChange]);

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-4 py-4 border-t border-[var(--bg-border)]">
            <p className="text-sm text-[var(--text-secondary)]">
                Showing <span className="font-medium text-[var(--text-primary)]">{startItem}-{endItem}</span> of{' '}
                <span className="font-medium text-[var(--text-primary)]">{totalItems}</span>
            </p>

            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors-fast disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: canGoPrevious ? 'var(--bg-primary)' : 'transparent',
                        color: canGoPrevious ? 'var(--text-primary)' : 'var(--text-disabled)',
                        border: '1px solid var(--bg-border)',
                    }}
                    onMouseEnter={(e) => {
                        if (canGoPrevious) {
                            e.currentTarget.style.borderColor = 'var(--gold)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--bg-border)';
                    }}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                <span className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors-fast disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: canGoNext ? 'var(--bg-primary)' : 'transparent',
                        color: canGoNext ? 'var(--text-primary)' : 'var(--text-disabled)',
                        border: '1px solid var(--bg-border)',
                    }}
                    onMouseEnter={(e) => {
                        if (canGoNext) {
                            e.currentTarget.style.borderColor = 'var(--gold)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--bg-border)';
                    }}
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/**
 * Toast Notification Component (Simple)
 */
function showToast(message: string): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all-fast';
    toast.style.cssText = `
        background-color: var(--bg-card);
        border: 1px solid var(--gold-border);
        color: var(--text-primary);
        font-size: 14px;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ============================================
// MAIN TRANSACTIONS PAGE
// ============================================

export default function TransactionsPage(): React.ReactElement {
    const { isAuthenticated, userId } = useAuthStore();

    // Local state
    const [filter, setFilter] = useState<TransactionFilter>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });

    // Fetch transactions with pagination
    const {
        transactions,
        isLoading,
        error,
        totalCount,
        refetch
    } = useTransactions({
        userId: userId || '',
        filter,
        startDate: dateRange.from || undefined,
        endDate: dateRange.to || undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
    });

    // Handle filter change - reset to page 1
    const handleFilterChange = useCallback((newFilter: TransactionFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
    }, []);

    // Handle export button click
    const handleExport = useCallback(() => {
        if (transactions.length === 0) {
            showToast('No transactions to export');
            return;
        }

        const headers = ['Date', 'Type', 'Direction', 'Amount', 'Merchant', 'Status', 'Description'];
        const rows = transactions.map((tx) => [
            new Date(tx.createdAt).toISOString(),
            tx.type,
            tx.direction,
            tx.amount.toFixed(2),
            tx.merchantName ?? '',
            tx.status,
            (tx.description ?? '').replace(/\n/g, ' '),
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [transactions]);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        // Scroll to top of transaction list
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Handle retry on error
    const handleRetry = useCallback(() => {
        refetch();
    }, [refetch]);

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
        <div className="mx-auto max-w-[1200px] pb-8">
            {/* Page Header */}
            <div className="mb-10 text-center sm:text-left">
                <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
                    Transaction History
                </h1>
                <div className="h-1 w-20 bg-gold rounded-full mb-4 shadow-[0_0_15px_rgba(163,230,53,0.5)] hidden sm:block" />
                <p className="text-[var(--text-secondary)]">
                    View and filter all your transactions
                </p>
            </div>

            {/* Filters and Export Row */}
            <div className="mb-6 space-y-4">
                {/* Filter Tabs */}
                <div
                    className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[var(--bg-border)]"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {FILTERS.map((f) => (
                        <FilterTab
                            key={f.value}
                            label={f.label}
                            isActive={filter === f.value}
                            onClick={() => handleFilterChange(f.value)}
                        />
                    ))}
                </div>

                {/* Date Range and Export */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <DateInput
                            label="From"
                            value={dateRange.from}
                            onChange={(value) => setDateRange(prev => ({ ...prev, from: value }))}
                        />
                        <DateInput
                            label="To"
                            value={dateRange.to}
                            onChange={(value) => setDateRange(prev => ({ ...prev, to: value }))}
                        />
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors-fast"
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid var(--bg-border)',
                            color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--gold)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--bg-border)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Transaction List */}
            <div className="rounded-2xl border border-zinc-800/50 bg-[rgba(15,15,15,0.7)] backdrop-blur-xl overflow-hidden shadow-2xl">
                {error ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <p className="text-lg font-medium text-[var(--text-primary)] mb-2">
                            Failed to load transactions
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">
                            {error}
                        </p>
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors-fast"
                            style={{
                                backgroundColor: 'var(--gold)',
                                color: 'var(--text-inverse)',
                            }}
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        <TransactionTimeline
                            transactions={transactions}
                            isLoading={isLoading}
                            filter={filter}
                            onFilterChange={handleFilterChange}
                            showFilters={false}
                            showViewAll={false}
                        />

                        {/* Pagination */}
                        {!isLoading && (
                            <Pagination
                                currentPage={currentPage}
                                totalItems={totalCount}
                                pageSize={PAGE_SIZE}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
