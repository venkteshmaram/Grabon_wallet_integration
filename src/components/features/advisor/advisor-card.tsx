// ============================================
// ADVISOR CARD COMPONENT
// Step 6: Claude Advisor Card - Production Grade
// ============================================

'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Bell, ChevronRight, RefreshCw } from 'lucide-react';
import type { AdvisorRecommendation } from '@/store/wallet-store';

// ============================================
// TYPES
// ============================================

interface AdvisorCardProps {
    /** Advisor recommendation data or null if loading */
    advisor: AdvisorRecommendation | null;
    /** Loading state for initial fetch */
    isLoading: boolean;
    /** Loading state specifically for refresh operation */
    isRefreshing: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Refresh callback */
    onRefresh: () => Promise<void>;
    /** Retry callback for error state */
    onRetry?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

// Regex to detect rupee amounts in text (₹X,XXX or ₹XXXX)
const RUPEE_REGEX = /₹[\d,]+/g;

// Regex to extract numeric value from action item for invest links
const INVEST_AMOUNT_REGEX = /Invest\s+₹([\d,]+)/i;

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

    if (seconds < 60) {
        return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }

    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Parse summary text and highlight rupee amounts
 */
function parseSummaryText(text: string | null | undefined): React.ReactNode[] {
    // Guard against non-string values
    if (!text || typeof text !== 'string') return [];

    const parts = text.split(RUPEE_REGEX);
    const matches = text.match(RUPEE_REGEX) || [];

    const result: React.ReactNode[] = [];

    parts.forEach((part, index) => {
        result.push(<span key={`text-${index}`}>{part}</span>);
        if (matches[index]) {
            result.push(
                <span
                    key={`amount-${index}`}
                    style={{ color: 'var(--gold)', fontWeight: 600 }}
                >
                    {matches[index]}
                </span>
            );
        }
    });

    return result;
}

/**
 * Extract invest amount from action item
 */
function extractInvestAmount(actionItem: string): number | null {
    const match = actionItem.match(INVEST_AMOUNT_REGEX);
    if (match && match[1]) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseInt(amountStr, 10);
        return isNaN(amount) ? null : amount;
    }
    return null;
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Loading Skeleton for Advisor Card
 */
function AdvisorCardSkeleton(): React.ReactElement {
    return (
        <div
            className="w-full rounded-[var(--radius-lg)] p-6"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderLeft: '4px solid var(--gold)',
            }}
        >
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="skeleton-gold h-5 w-5 rounded" />
                    <div className="skeleton h-5 w-36 rounded" />
                </div>
                <div className="skeleton h-4 w-24 rounded" />
            </div>

            {/* Generating Message */}
            <div className="mb-6 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--gold)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                    Generating your personalised analysis...
                </p>
            </div>

            {/* Summary Skeleton */}
            <div className="skeleton h-20 w-full rounded mb-6" />

            {/* Recommendation Skeleton */}
            <div
                className="skeleton-gold h-24 w-full rounded mb-6"
                style={{ backgroundColor: 'var(--gold-muted)' }}
            />

            {/* Action Items Skeleton */}
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="skeleton-gold h-4 w-4 rounded" />
                        <div className="skeleton h-4 w-full rounded" />
                    </div>
                ))}
            </div>

            {/* Refresh Button Skeleton */}
            <div className="mt-6 flex justify-end">
                <div className="skeleton h-10 w-32 rounded" />
            </div>
        </div>
    );
}

/**
 * Error State for Advisor Card
 */
function AdvisorCardError({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}): React.ReactElement {
    return (
        <div
            className="w-full rounded-[var(--radius-lg)] p-6"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderLeft: '4px solid var(--red)',
            }}
        >
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-12 h-12 mb-4" style={{ color: 'var(--red)' }} />
                <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Failed to load advisor recommendation
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
 * Action Item Component - Renders as button if it contains invest amount
 */
interface ActionItemProps {
    text: string;
    onInvest?: (amount: number) => void;
}

function ActionItem({ text, onInvest }: ActionItemProps): React.ReactElement {
    const investAmount = useMemo(() => extractInvestAmount(text), [text]);

    const handleClick = useCallback(() => {
        if (investAmount && onInvest) {
            onInvest(investAmount);
        }
    }, [investAmount, onInvest]);

    // If it's an invest action, render as clickable button
    if (investAmount) {
        return (
            <button
                onClick={handleClick}
                className="flex items-center gap-2 w-full text-left p-3 rounded-[var(--radius-md)] transition-colors-fast"
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
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{text}</span>
            </button>
        );
    }

    // Regular action item
    return (
        <div className="flex items-center gap-2 py-2">
            <ChevronRight
                className="w-4 h-4 flex-shrink-0"
                style={{ color: 'var(--gold)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {text}
            </span>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Advisor Card Component
 * 
 * Displays AI Financial Advisor recommendations with summary, 
 * recommendation, action items, and optional alert.
 * 
 * @example
 * ```tsx
 * <AdvisorCard
 *   advisor={advisor}
 *   isLoading={false}
 *   isRefreshing={false}
 *   error={null}
 *   onRefresh={refresh}
 * />
 * ```
 */
export function AdvisorCard({
    advisor,
    isLoading,
    isRefreshing,
    error,
    onRefresh,
    onRetry,
}: AdvisorCardProps): React.ReactElement {
    const router = useRouter();

    // Handle invest navigation
    const handleInvest = useCallback(
        (amount: number) => {
            router.push(`/wallet/invest?amount=${amount}`);
        },
        [router]
    );

    // Loading state
    if (isLoading && !advisor) {
        return <AdvisorCardSkeleton />;
    }

    // Error state
    if (error) {
        return <AdvisorCardError message={error} onRetry={onRetry} />;
    }

    // Empty state - no advisor yet (new users)
    if (!advisor) {
        return (
            <div
                className="w-full rounded-[var(--radius-lg)] p-6"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    borderLeft: '4px solid var(--gold)',
                }}
            >
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--gold)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Generating your personalised analysis...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const hasActionItems = advisor.actionItems && advisor.actionItems.length > 0;
    const hasAlert = advisor.alert && advisor.alert.trim().length > 0;

    return (
        <div
            className="w-full rounded-2xl p-8 backdrop-blur-xl border border-zinc-800/50"
            style={{
                backgroundColor: 'rgba(15, 15, 15, 0.5)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
        >
            {/* Header Row */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                    <h3
                        className="text-base font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        AI Financial Advisor
                    </h3>
                </div>
                {advisor.generatedAt && (
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Last updated {formatTimeAgo(advisor.generatedAt)}
                    </span>
                )}
            </div>

            {/* Summary Section */}
            {advisor.summary && (
                <div className="mb-6">
                    <p
                        className="text-base leading-relaxed"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {parseSummaryText(advisor.summary)}
                    </p>
                </div>
            )}

            {/* Recommendation Section */}
            {advisor.recommendation && (
                <div
                    className="mb-6 p-5 rounded-xl border border-gold/10 relative overflow-hidden group"
                    style={{
                        backgroundColor: 'rgba(163, 230, 53, 0.03)',
                    }}
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gold/50 shadow-[0_0_15px_rgba(163,230,53,0.3)]" />
                    <p
                        className="text-sm leading-relaxed text-zinc-300 italic"
                    >
                        {parseSummaryText(advisor.recommendation)}
                    </p>
                </div>
            )}

            {/* Action Items Section */}
            {hasActionItems && (
                <div className="mb-6 space-y-2">
                    {advisor.actionItems.map((item, index) => (
                        <ActionItem
                            key={index}
                            text={item}
                            onInvest={handleInvest}
                        />
                    ))}
                </div>
            )}

            {/* Alert Section (conditional) */}
            {hasAlert && (
                <div
                    className="mb-6 p-4 rounded-[var(--radius-md)] flex items-start gap-3"
                    style={{
                        backgroundColor: 'rgba(245, 166, 35, 0.08)',
                        borderLeft: '3px solid var(--gold)',
                    }}
                >
                    <Bell
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: 'var(--gold)' }}
                    />
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {advisor.alert}
                    </p>
                </div>
            )}

            {/* Bottom Row - Refresh Button */}
            <div className="flex justify-end">
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm transition-colors-fast disabled:opacity-50"
                    style={{
                        backgroundColor: 'transparent',
                        color: 'var(--gold)',
                        border: '1px solid var(--gold)',
                    }}
                    onMouseEnter={(e) => {
                        if (!isRefreshing) {
                            e.currentTarget.style.backgroundColor = 'var(--gold-muted)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    {isRefreshing ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analysing your financial patterns...</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh Analysis</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// ============================================
// EXPORTS
// ============================================

export type { AdvisorCardProps };
export { AdvisorCardSkeleton, AdvisorCardError };
