// ============================================
// TOP MERCHANTS COMPONENT - Ranked Merchant List
// Step 9: Spend Analytics Components
// ============================================

'use client';

import React from 'react';
import { Store } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface MerchantData {
    merchantName: string;
    category?: string | null;
    amountRupees: number;
    transactionCount: number;
}

interface TopMerchantsProps {
    /** Array of merchant data */
    merchants: MerchantData[];
    /** Loading state */
    isLoading: boolean;
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
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// ============================================
// LOADING SKELETON COMPONENT
// ============================================

function MerchantSkeleton(): React.ReactElement {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-[var(--bg-primary)] p-3"
                >
                    {/* Rank Circle */}
                    <div className="animate-shimmer h-7 w-7 rounded-full bg-[var(--bg-border)]" />
                    {/* Merchant Info */}
                    <div className="flex-1 space-y-1">
                        <div className="animate-shimmer h-4 w-24 rounded bg-[var(--bg-border)]" />
                        <div className="animate-shimmer h-3 w-16 rounded bg-[var(--bg-border)]" />
                    </div>
                    {/* Cashback Info */}
                    <div className="space-y-1 text-right">
                        <div className="animate-shimmer h-4 w-16 rounded bg-[var(--bg-border)]" />
                        <div className="animate-shimmer h-3 w-12 rounded bg-[var(--bg-border)]" />
                    </div>
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
        <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)]">
                <Store className="h-6 w-6 text-[var(--text-disabled)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">No merchant data yet</p>
        </div>
    );
}

// ============================================
// MERCHANT ROW COMPONENT
// ============================================

interface MerchantRowProps {
    merchant: MerchantData;
    rank: number;
}

function MerchantRow({ merchant, rank }: MerchantRowProps): React.ReactElement {
    return (
        <div className="flex items-center gap-3 rounded-lg bg-[var(--bg-primary)] p-3 transition-colors hover:bg-[#2E2E2E]">
            {/* Rank Circle */}
            <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--bg-primary)]"
            >
                {rank}
            </div>

            {/* Merchant Info */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {merchant.merchantName}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                    {merchant.category || 'Partner Merchant'}
                </p>
            </div>

            {/* Cashback Info */}
            <div className="text-right">
                <p className="text-sm font-semibold text-[#22C55E]">
                    +{formatRupees(merchant.amountRupees)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                    {merchant.transactionCount} transactions
                </p>
            </div>
        </div>
    );
}

// ============================================
// MAIN TOP MERCHANTS COMPONENT
// ============================================

export function TopMerchants({
    merchants,
    isLoading,
}: TopMerchantsProps): React.ReactElement {
    // Loading state
    if (isLoading) {
        return <MerchantSkeleton />;
    }

    // Empty state
    if (merchants.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-3">
            {merchants.slice(0, 5).map((merchant, index) => (
                <MerchantRow
                    key={merchant.merchantName + index}
                    merchant={merchant}
                    rank={index + 1}
                />
            ))}
        </div>
    );
}

// Export types
export type { TopMerchantsProps, MerchantData };
