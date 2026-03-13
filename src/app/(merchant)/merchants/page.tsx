// ============================================
// MERCHANTS PAGE - Merchant Grid Listing
// Step 13: Merchant + Checkout Pages - Production Grade
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api-client';
import { Store, ArrowRight } from 'lucide-react';

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
    Food: 'var(--orange)',
    Shopping: 'var(--green)',
    Travel: 'var(--blue)',
    Entertainment: 'var(--slate)',
    default: 'var(--gold)',
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
            className="w-full text-left rounded-[2rem] border transition-all duration-500 group relative overflow-hidden h-[220px]"
            style={{
                backgroundColor: 'rgba(15, 15, 15, 0.4)',
                borderColor: 'rgba(255, 255, 255, 0.05)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {/* Background Content (Logo or Initials) */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-8 transition-transform duration-700 group-hover:scale-110">
                {merchant.logoUrl ? (
                    <img 
                        src={merchant.logoUrl} 
                        alt={merchant.name} 
                        className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    />
                ) : (
                    <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white font-black text-4xl opacity-10"
                        style={{ backgroundColor: categoryColor }}
                    >
                        {initials}
                    </div>
                )}
            </div>

            {/* Premium Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Category Tag (Top Right) */}
            <div className="absolute top-4 right-4">
                <span
                    className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] backdrop-blur-md border border-white/5"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                    }}
                >
                    {merchant.category}
                </span>
            </div>

            {/* Bottom Content Area */}
            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-1 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                <div className="space-y-0">
                    <h3 className="text-xl font-black text-white tracking-tighter leading-none">
                        {merchant.name}
                    </h3>
                </div>
                
                <div className="flex items-end justify-between">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                             <div className="h-1 w-6 bg-gold rounded-full" />
                             <span className="text-[10px] font-black text-gold uppercase tracking-widest">
                                Cashback
                             </span>
                        </div>
                        <p className="text-2xl font-black text-white tracking-tight">
                            {merchant.cashbackRate}%
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-3 group-hover:translate-x-0">
                        <span>Checkout</span>
                        <ArrowRight className="w-3 h-3 text-gold" />
                    </div>
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

    return (
        <div className="mx-auto max-w-[1200px] pb-8">
            {/* Page Header */}
            <div className="mb-10 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-2">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)] mb-2 sm:mb-0"
                        style={{ backgroundColor: 'var(--gold-muted)' }}
                    >
                        <Store className="w-7 h-7" style={{ color: 'var(--gold)' }} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
                            Partner Merchants
                        </h1>
                        <div className="h-1 w-20 bg-gold rounded-full my-2 shadow-[0_0_15px_rgba(163,230,53,0.5)] mx-auto sm:mx-0" />
                        <p className="text-[var(--text-secondary)]">
                            Shop at our partner stores and earn cashback
                        </p>
                    </div>
                </div>
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

        </div>
    );
}
