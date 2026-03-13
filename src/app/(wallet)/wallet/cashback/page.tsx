'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiGet } from '@/lib/api-client';
import {
    Clock,
    Zap,
    ShoppingBag,
    Utensils,
    Calendar,
    ArrowRight,
    Wallet
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface CashbackEntry {
    id: string;
    amount: number;
    merchantName: string;
    category: string;
    status: 'PENDING' | 'SETTLED';
    createdAt: string;
    settledAt?: string;
    estimatedSettlement: string;
    settlementType: 'IMMEDIATE' | 'GRACE_PERIOD';
    gracePeriodDays: number;
}

interface CashbackResponse {
    data: {
        pending: CashbackEntry[];
        settled: CashbackEntry[];
        totalPending: number;
        totalSettled: number;
    };
}

// ============================================
// MERCHANT SETTLEMENT RULES
// ============================================

const MERCHANT_RULES: Record<string, { type: 'IMMEDIATE' | 'GRACE_PERIOD'; days: number }> = {
    // Food Delivery - Immediate (no cancellations)
    'Zomato': { type: 'IMMEDIATE', days: 0 },
    'Swiggy': { type: 'IMMEDIATE', days: 0 },
    'Dominos': { type: 'IMMEDIATE', days: 0 },
    'Pizza Hut': { type: 'IMMEDIATE', days: 0 },
    'McDonald\'s': { type: 'IMMEDIATE', days: 0 },
    'KFC': { type: 'IMMEDIATE', days: 0 },
    'Uber Eats': { type: 'IMMEDIATE', days: 0 },

    // E-commerce - 14 day grace period (for returns)
    'Amazon': { type: 'GRACE_PERIOD', days: 14 },
    'Flipkart': { type: 'GRACE_PERIOD', days: 14 },
    'Myntra': { type: 'GRACE_PERIOD', days: 14 },
    'Nykaa': { type: 'GRACE_PERIOD', days: 14 },
    'AJIO': { type: 'GRACE_PERIOD', days: 14 },
    'Tata CLiQ': { type: 'GRACE_PERIOD', days: 14 },
    'Snapdeal': { type: 'GRACE_PERIOD', days: 14 },

    // Default
    'DEFAULT': { type: 'GRACE_PERIOD', days: 7 },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}

function getSettlementRule(merchantName: string) {
    return MERCHANT_RULES[merchantName] || MERCHANT_RULES['DEFAULT'];
}

function calculateEstimatedSettlement(createdAt: string, days: number): string {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getTimeRemaining(estimatedDate: string): string {
    const now = new Date();
    const estimated = new Date(estimatedDate);
    const diff = estimated.getTime() - now.getTime();

    if (diff <= 0) return 'Processing...';

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 1) return '1 day left';
    return `${days} days left`;
}

// ============================================
// COMPONENTS
// ============================================

function CashbackCard({ entry }: { entry: CashbackEntry }) {
    const isImmediate = entry.settlementType === 'IMMEDIATE';
    const Icon = isImmediate ? Zap : Clock;
    const bgColor = isImmediate ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200';
    const iconColor = isImmediate ? 'text-green-600' : 'text-amber-600';

    return (
        <div className={`rounded-lg border p-4 ${bgColor}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-white ${iconColor}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{entry.merchantName}</p>
                        <p className="text-sm text-gray-600">{entry.category}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">{formatCurrency(entry.amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${isImmediate
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                        {isImmediate ? 'Instant' : `${entry.gracePeriodDays} days`}
                    </span>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                        Created: {new Date(entry.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <span className={`font-medium ${isImmediate ? 'text-green-600' : 'text-amber-600'}`}>
                        {entry.status === 'PENDING'
                            ? getTimeRemaining(entry.estimatedSettlement)
                            : `Credited on ${new Date(entry.settledAt!).toLocaleDateString('en-IN')}`
                        }
                    </span>
                </div>
                {entry.status === 'PENDING' && !isImmediate && (
                    <p className="text-xs text-gray-500 mt-1">
                        Will be credited by {entry.estimatedSettlement}
                    </p>
                )}
            </div>
        </div>
    );
}

function SectionHeader({
    title,
    icon: Icon,
    count,
    amount,
    color
}: {
    title: string;
    icon: React.ElementType;
    count: number;
    amount: number;
    color: string;
}) {
    return (
        <div className={`rounded-lg p-4 mb-4 ${color}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6" />
                    <div>
                        <h3 className="font-semibold text-lg">{title}</h3>
                        <p className="text-sm opacity-80">{count} transactions</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
                    <p className="text-sm opacity-80">total</p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function CashbackPage() {
    const { userId } = useAuthStore();
    const [pendingCashback, setPendingCashback] = useState<CashbackEntry[]>([]);
    const [settledCashback, setSettledCashback] = useState<CashbackEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const fetchCashback = async () => {
            try {
                setLoading(true);
                const response = await apiGet<CashbackResponse>(`/api/wallet/${userId}/cashback`);

                // Sort by settlement type and date
                const pending = response.data?.pending || [];
                const settled = response.data?.settled || [];

                setPendingCashback(pending);
                setSettledCashback(settled);
            } catch (err) {
                setError('Failed to load cashback data');
            } finally {
                setLoading(false);
            }
        };

        fetchCashback();
    }, [userId]);

    // Separate pending by settlement type
    const immediatePending = pendingCashback.filter(c => c.settlementType === 'IMMEDIATE');
    const gracePeriodPending = pendingCashback.filter(c => c.settlementType === 'GRACE_PERIOD');

    const totalPending = pendingCashback.reduce((sum, c) => sum + c.amount, 0);
    const totalSettled = settledCashback.reduce((sum, c) => sum + c.amount, 0);
    const totalImmediate = immediatePending.reduce((sum, c) => sum + c.amount, 0);
    const totalGrace = gracePeriodPending.reduce((sum, c) => sum + c.amount, 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Link href="/wallet" className="hover:text-blue-600 flex items-center gap-1">
                        <Wallet className="w-4 h-4" />
                        Wallet
                    </Link>
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">Cashback</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Cashback Tracker</h1>
                <p className="text-gray-600 mt-2">
                    Track your pending and settled cashback rewards
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Total Pending</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalPending)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Instant (Food)</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(totalImmediate)}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">Total Settled</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalSettled)}</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Settlement Rules Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">Settlement Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Zap className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Instant Settlement</p>
                            <p className="text-sm text-gray-600">
                                Zomato, Swiggy, Dominos, McDonald's, KFC - credited in minutes
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">14-Day Grace Period</p>
                            <p className="text-sm text-gray-600">
                                Amazon, Flipkart, Myntra, Nykaa - allows for returns/cancellations
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending - Immediate */}
            {immediatePending.length > 0 && (
                <div className="mb-8">
                    <SectionHeader
                        title="Instant Cashback (Processing)"
                        icon={Utensils}
                        count={immediatePending.length}
                        amount={totalImmediate}
                        color="bg-green-100 border border-green-200"
                    />
                    <div className="space-y-3">
                        {immediatePending.map(entry => (
                            <CashbackCard key={entry.id} entry={entry} />
                        ))}
                    </div>
                </div>
            )}

            {/* Pending - Grace Period */}
            {gracePeriodPending.length > 0 && (
                <div className="mb-8">
                    <SectionHeader
                        title="Pending Cashback (Grace Period)"
                        icon={ShoppingBag}
                        count={gracePeriodPending.length}
                        amount={totalGrace}
                        color="bg-amber-100 border border-amber-200"
                    />
                    <div className="space-y-3">
                        {gracePeriodPending.map(entry => (
                            <CashbackCard key={entry.id} entry={entry} />
                        ))}
                    </div>
                </div>
            )}

            {/* Settled */}
            {settledCashback.length > 0 && (
                <div className="mb-8">
                    <SectionHeader
                        title="Settled Cashback"
                        icon={Wallet}
                        count={settledCashback.length}
                        amount={totalSettled}
                        color="bg-purple-100 border border-purple-200"
                    />
                    <div className="space-y-3">
                        {settledCashback.slice(0, 5).map(entry => (
                            <CashbackCard key={entry.id} entry={entry} />
                        ))}
                        {settledCashback.length > 5 && (
                            <p className="text-center text-gray-500 text-sm py-2">
                                +{settledCashback.length - 5} more settled transactions
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {pendingCashback.length === 0 && settledCashback.length === 0 && !error && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Cashback Yet</h3>
                    <p className="text-gray-600 mb-4">
                        Start shopping at our partner merchants to earn cashback!
                    </p>
                    <Link
                        href="/merchants"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Browse Merchants
                    </Link>
                </div>
            )}
        </div>
    );
}
