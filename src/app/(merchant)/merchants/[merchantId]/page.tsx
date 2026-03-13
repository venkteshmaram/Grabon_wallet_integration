// ============================================
// MERCHANT DETAIL PAGE - Merchant Detail with Pay Option
// Step 13: Merchant + Checkout Pages - Production Grade
// ============================================

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiGet } from '@/lib/api-client';
import { useWalletStore } from '@/store/wallet-store';
import { Store, ArrowLeft, ArrowRight, Receipt, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useTransactions } from '@/hooks/use-transactions';

// ============================================
// TYPES
// ============================================

interface Merchant {
    id: string;
    name: string;
    category: string;
    cashbackRate: number;
    description?: string;
}

interface MerchantApiResponse {
    data: Merchant;
}

// ============================================
// CONSTANTS
// ============================================

const CATEGORY_COLORS: Record<string, string> = {
    Food: '#F5A623',
    Shopping: '#22C55E',
    Travel: '#38BDF8',
    Entertainment: '#94A3B8',
    default: '#F5A623',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Loading Skeleton
 */
function MerchantDetailSkeleton(): React.ReactElement {
    return (
        <div className="mx-auto max-w-[600px]">
            <div className="animate-pulse">
                <div className="skeleton h-4 w-20 rounded mb-6" />
                <div className="flex items-center gap-4 mb-6">
                    <div className="skeleton w-16 h-16 rounded-full" />
                    <div>
                        <div className="skeleton h-6 w-40 rounded mb-2" />
                        <div className="skeleton h-4 w-24 rounded" />
                    </div>
                </div>
                <div className="skeleton h-4 w-32 rounded mb-8" />
                <div
                    className="rounded-xl p-6 mb-6"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
                >
                    <div className="skeleton h-4 w-24 rounded mb-4" />
                    <div className="skeleton h-12 w-full rounded mb-4" />
                    <div className="skeleton h-12 w-full rounded" />
                </div>
            </div>
        </div>
    );
}

/**
 * Error State
 */
function ErrorState({ onRetry }: { onRetry: () => void }): React.ReactElement {
    return (
        <div className="mx-auto max-w-[600px] flex flex-col items-center justify-center py-16 px-4">
            <Store className="w-16 h-16 mb-4" style={{ color: 'var(--red)' }} />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Failed to load merchant
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">
                Something went wrong while fetching merchant details
            </p>
            <button
                onClick={onRetry}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors-fast"
                style={{
                    backgroundColor: 'var(--gold)',
                    color: 'var(--text-inverse)',
                }}
            >
                Retry
            </button>
        </div>
    );
}

/**
 * Recent Transaction Item
 */
interface TransactionItemProps {
    description: string;
    date: string;
    amount: number;
}

function TransactionItem({ description, date, amount }: TransactionItemProps): React.ReactElement {
    return (
        <div className="flex items-center justify-between py-3 border-b border-[var(--bg-border)] last:border-0">
            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                    <Receipt className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{description}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{date}</p>
                </div>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--red)' }}>
                -₹{amount.toFixed(2)}
            </span>
        </div>
    );
}

// ============================================
// MAIN MERCHANT DETAIL PAGE
// ============================================

export default function MerchantDetailPage(): React.ReactElement {
    const router = useRouter();
    const params = useParams();
    const merchantId = params.merchantId as string;
    const { userId } = useAuthStore();

    // State
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get wallet data from store
    const wallet = useWalletStore((state) => state.wallet);

    const { transactions: merchantTransactions } = useTransactions({
        userId: userId || '',
        filter: 'SPENDS',
        merchantId,
        page: 1,
        pageSize: 5,
    });

    const recentTransactions = useMemo(() => {
        return merchantTransactions.slice(0, 5).map((tx) => ({
            description: tx.description || tx.merchantName || 'Wallet payment',
            date: new Date(tx.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }),
            amount: tx.amount,
        }));
    }, [merchantTransactions]);

    // Fetch merchant details
    const fetchMerchant = useCallback(async () => {
        if (!merchantId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await apiGet<MerchantApiResponse>(`/api/merchants/${merchantId}`);
            if (response.data) {
                setMerchant(response.data);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch merchant details';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [merchantId]);

    // Load merchant on mount
    useEffect(() => {
        fetchMerchant();
    }, [fetchMerchant]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        router.push('/merchants');
    }, [router]);

    // Handle pay at merchant
    const handlePay = useCallback(() => {
        if (!merchant) return;
        router.push(`/checkout?merchantId=${merchant.id}&merchantName=${encodeURIComponent(merchant.name)}`);
    }, [router, merchant]);

    // Handle view all transactions
    const handleViewAllTransactions = useCallback(() => {
        router.push('/wallet/transactions');
    }, [router]);

    if (isLoading) {
        return <MerchantDetailSkeleton />;
    }

    if (error) {
        return <ErrorState onRetry={fetchMerchant} />;
    }

    if (!merchant) {
        return <ErrorState onRetry={fetchMerchant} />;
    }

    const categoryColor = getCategoryColor(merchant.category);
    const initials = getInitials(merchant.name);
    const availableBalance = wallet?.availableRupees ?? 0;

    return (
        <div className="mx-auto max-w-[600px] pb-8">
            {/* Back Button */}
            <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors-fast"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Merchants
            </button>

            {/* Merchant Header */}
            <div className="flex items-center gap-4 mb-6">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: categoryColor }}
                >
                    {initials}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        {merchant.name}
                    </h1>
                    <span
                        className="text-sm px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {merchant.category}
                    </span>
                </div>
            </div>

            {/* Cashback Rate */}
            <div className="mb-8">
                <p className="text-sm text-[var(--text-secondary)] mb-1">Cashback Rate</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                    {merchant.cashbackRate}% Cashback
                </p>
            </div>

            {/* Pay Card */}
            <div
                className="rounded-xl p-6 mb-6"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[var(--text-secondary)]">Available Balance</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--green)' }}>
                        ₹{availableBalance.toFixed(2)}
                    </span>
                </div>

                <button
                    onClick={handlePay}
                    className="w-full py-4 rounded-xl font-semibold text-base transition-all-fast flex items-center justify-center gap-2"
                    style={{
                        backgroundColor: 'var(--gold)',
                        color: 'var(--text-inverse)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--gold-hover)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--gold)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    Pay at this merchant
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* Recent Transactions */}
            <div
                className="rounded-xl p-6"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                        Recent Transactions
                    </h2>
                    <button
                        onClick={handleViewAllTransactions}
                        className="text-sm font-medium transition-colors-fast"
                        style={{ color: 'var(--gold)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--gold)'; }}
                    >
                        View All
                    </button>
                </div>

                {recentTransactions.length > 0 ? (
                    <div>
                        {recentTransactions.map((tx, index) => (
                            <TransactionItem
                                key={index}
                                description={tx.description}
                                date={tx.date}
                                amount={tx.amount}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Clock className="w-12 h-12 mb-3" style={{ color: 'var(--text-disabled)' }} />
                        <p className="text-sm text-[var(--text-secondary)]">
                            No recent transactions at this merchant
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
