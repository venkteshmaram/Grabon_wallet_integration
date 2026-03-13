// ============================================
// MERCHANTS PAGE - Merchant Grid Listing
// Step 13: Merchant + Checkout Pages - Production Grade
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api-client';
import { Store, QrCode, ArrowRight } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Merchant {
    id: string;
    name: string;
    category: 'Food' | 'Shopping' | 'Travel' | 'Entertainment' | string;
    cashbackRate: number;
    logoUrl?: string;
}

interface MerchantsApiResponse {
    data: Merchant[];
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
 * Merchant Card Component
 */
interface MerchantCardProps {
    merchant: Merchant;
    onClick: () => void;
}

function MerchantCard({ merchant, onClick }: MerchantCardProps): React.ReactElement {
    const categoryColor = getCategoryColor(merchant.category);
    const initials = getInitials(merchant.name);

    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-xl border transition-all-fast group"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--bg-border)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--bg-border)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div className="p-5">
                {/* Top Section: Icon + Category */}
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: categoryColor }}
                    >
                        {initials}
                    </div>
                    <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {merchant.category}
                    </span>
                </div>

                {/* Merchant Name */}
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    {merchant.name}
                </h3>

                {/* Cashback Rate */}
                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--gold)' }}>
                    Up to {merchant.cashbackRate}% cashback
                </p>

                {/* Pay Now Link */}
                <div className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--gold)' }}>
                    <span>Pay Now</span>
                    <ArrowRight className="w-4 h-4 transition-transform-fast group-hover:translate-x-1" />
                </div>
            </div>
        </button>
    );
}

/**
 * Loading Skeleton for Merchant Card
 */
function MerchantCardSkeleton(): React.ReactElement {
    return (
        <div
            className="w-full rounded-xl p-5 animate-pulse"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--bg-border)',
            }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-5 w-32 rounded mb-2" />
            <div className="skeleton h-4 w-24 rounded mb-4" />
            <div className="skeleton h-4 w-20 rounded" />
        </div>
    );
}

/**
 * Empty State Component
 */
function EmptyState(): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <Store className="w-16 h-16 mb-4" style={{ color: 'var(--text-disabled)' }} />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                No merchants found
            </h3>
            <p className="text-sm text-[var(--text-secondary)] text-center">
                Check back later for new partner merchants
            </p>
        </div>
    );
}

/**
 * Error State Component
 */
function ErrorState({ onRetry }: { onRetry: () => void }): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--red-muted)' }}
            >
                <Store className="w-8 h-8" style={{ color: 'var(--red)' }} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Failed to load merchants
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">
                Something went wrong while fetching merchant data
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

// ============================================
// MAIN MERCHANTS PAGE
// ============================================

export default function MerchantsPage(): React.ReactElement {
    const router = useRouter();

    // State
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch merchants
    const fetchMerchants = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiGet<MerchantsApiResponse>('/api/merchants');
            if (response.data) {
                setMerchants(response.data);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch merchants';
            setError(message);
            console.error('Failed to fetch merchants:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load merchants on mount
    useEffect(() => {
        fetchMerchants();
    }, [fetchMerchants]);

    // Handle merchant click
    const handleMerchantClick = useCallback((merchantId: string) => {
        router.push(`/merchants/${merchantId}`);
    }, [router]);

    // Handle QR pay navigation
    const handleQRPay = useCallback(() => {
        router.push('/qr-pay');
    }, [router]);

    return (
        <div className="mx-auto max-w-[1200px] pb-8">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--gold-muted)' }}
                    >
                        <Store className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Partner Merchants
                    </h1>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                    Shop at our partner stores and earn cashback
                </p>
            </div>

            {/* Merchants Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <MerchantCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <ErrorState onRetry={fetchMerchants} />
            ) : merchants.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {merchants.map((merchant) => (
                        <MerchantCard
                            key={merchant.id}
                            merchant={merchant}
                            onClick={() => handleMerchantClick(merchant.id)}
                        />
                    ))}
                </div>
            )}

            {/* QR Pay Button */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={handleQRPay}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all-fast"
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
                    <QrCode className="w-5 h-5" />
                    Scan QR to Pay
                </button>
            </div>
        </div>
    );
}
