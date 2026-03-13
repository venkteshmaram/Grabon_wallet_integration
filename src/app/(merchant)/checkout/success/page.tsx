// ============================================
// CHECKOUT SUCCESS PAGE - Payment Success
// Step 13: Merchant + Checkout Pages - Production Grade
// ============================================

'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';
import { CheckCircle2, ArrowRight, Receipt, Clock } from 'lucide-react';

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // PayU success callback amount is in rupees string (e.g., "500.00")
    // so we render directly without paisa conversion.
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(numAmount);
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ============================================
// MAIN SUCCESS PAGE
// ============================================

export default function CheckoutSuccessPage(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userId } = useAuthStore();
    const refreshAll = useWalletStore((state) => state.refreshAll);

    // Get transaction details from URL params
    const txnid = searchParams.get('txnid') || 'N/A';
    const amount = searchParams.get('amount') || '0';
    const productinfo = searchParams.get('productinfo') || 'Payment';

    // Refresh wallet balance on mount
    useEffect(() => {
        if (userId) {
            refreshAll(userId);
        }
    }, [userId, refreshAll]);

    // Handle return to dashboard
    const handleReturnToDashboard = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
            <div
                className="w-full max-w-md rounded-2xl p-8 text-center backdrop-blur-2xl border border-zinc-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                style={{
                    backgroundColor: 'rgba(15, 15, 15, 0.75)',
                }}
            >
                {/* Success Icon */}
                <div className="mb-6">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto checkmark-bounce"
                        style={{ backgroundColor: 'var(--green-muted)' }}
                    >
                        <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--green)' }} />
                    </div>
                </div>

                {/* Success Message */}
                <h1
                    className="text-2xl font-bold mb-2"
                    style={{ color: 'var(--green)' }}
                >
                    Payment Successful!
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mb-8">
                    Your transaction has been completed successfully
                </p>

                {/* Transaction Details */}
                <div
                    className="rounded-xl p-5 mb-8 text-left bg-zinc-900/50 border border-zinc-800/30"
                >
                    <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <Receipt className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                        Transaction Details
                    </h2>

                    <div className="space-y-4">
                        {/* Amount */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-secondary)]">Amount</span>
                            <span className="text-lg font-bold text-[var(--text-primary)]">
                                {formatCurrency(amount)}
                            </span>
                        </div>

                        {/* Merchant */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-secondary)]">Description</span>
                            <span className="text-sm font-medium text-[var(--text-primary)] text-right max-w-[50%]">
                                {productinfo}
                            </span>
                        </div>

                        {/* Transaction ID */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-secondary)]">Transaction ID</span>
                            <span className="text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-card)] px-2 py-1 rounded">
                                {txnid.slice(0, 16)}...
                            </span>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--bg-border)]">
                            <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Date & Time
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                                {formatDate(new Date())}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Return Button */}
                <button
                    onClick={handleReturnToDashboard}
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
                    Return to Dashboard
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
