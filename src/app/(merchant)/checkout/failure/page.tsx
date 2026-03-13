// ============================================
// CHECKOUT FAILURE PAGE - Payment Failure
// Step 13: Merchant + Checkout Pages - Production Grade
// ============================================

'use client';

import React, { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw, Home, AlertTriangle } from 'lucide-react';

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getErrorMessage(status: string | null): string {
    const errorMessages: Record<string, string> = {
        'failure': 'Your payment could not be processed. Please try again.',
        'cancelled': 'You cancelled the payment. No amount was deducted.',
        'timeout': 'The payment session timed out. Please try again.',
        'declined': 'Your payment was declined by the bank. Please try a different method.',
        'error': 'An error occurred while processing your payment.',
    };

    return errorMessages[status || ''] || 'Something went wrong with your payment. Please try again.';
}

// ============================================
// MAIN FAILURE PAGE
// ============================================

export default function CheckoutFailurePage(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get error details from URL params
    const status = searchParams.get('status') || 'failure';
    const errorMessage = searchParams.get('message') || getErrorMessage(status);

    // Handle try again
    const handleTryAgain = useCallback(() => {
        router.push('/checkout');
    }, [router]);

    // Handle return to dashboard
    const handleReturnToDashboard = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
            <div
                className="w-full max-w-md rounded-2xl p-8 text-center"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--bg-border)',
                }}
            >
                {/* Error Icon */}
                <div className="mb-6">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                        style={{
                            backgroundColor: 'var(--red-muted)',
                            animation: 'shake 0.5s ease-in-out',
                        }}
                    >
                        <XCircle className="w-10 h-10" style={{ color: 'var(--red)' }} />
                    </div>
                </div>

                {/* Error Message */}
                <h1
                    className="text-2xl font-bold mb-2"
                    style={{ color: 'var(--red)' }}
                >
                    Payment Failed
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    {errorMessage}
                </p>

                {/* Error Details Card */}
                <div
                    className="rounded-xl p-4 mb-8 text-left"
                    style={{
                        backgroundColor: 'var(--red-muted)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
                        <div>
                            <p className="text-sm font-medium mb-1" style={{ color: 'var(--red)' }}>
                                No amount deducted
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Your account has not been charged. You can try the payment again or return to the dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Try Again Button */}
                    <button
                        onClick={handleTryAgain}
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
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </button>

                    {/* Return to Dashboard Button */}
                    <button
                        onClick={handleReturnToDashboard}
                        className="w-full py-4 rounded-xl font-semibold text-base transition-all-fast flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--bg-border)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--gold)';
                            e.currentTarget.style.color = 'var(--gold)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--bg-border)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                    >
                        <Home className="w-5 h-5" />
                        Return to Dashboard
                    </button>
                </div>

                {/* Help Text */}
                <p className="text-xs text-[var(--text-tertiary)] mt-6">
                    Need help? Contact support for assistance with your payment.
                </p>
            </div>
        </div>
    );
}
