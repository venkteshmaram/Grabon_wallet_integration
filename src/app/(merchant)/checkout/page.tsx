// ============================================
// CHECKOUT PAGE - Checkout with Fraud Check + PayU Redirect
// Step 13: Merchant + Checkout Pages - Production Grade
// ============================================

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api-client';
import { useWalletStore } from '@/store/wallet-store';
import { useAuthStore } from '@/store/auth-store';
import { OtpModal } from '@/components/features/fraud';
import {
    ShoppingCart,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    Wallet,
    ShieldAlert
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type FraudAction = 'ALLOW' | 'REQUIRE_OTP' | 'BLOCK' | 'FREEZE';

interface FraudCheckResponse {
    data: {
        action: FraudAction;
        reason?: string;
        otp?: string;
    };
}

interface PayUInitiateResponse {
    success: boolean;
    payuBaseUrl?: string;
    payuParams?: Record<string, string>;
    data?: {
        formUrl?: string;
        formParams?: Record<string, string>;
    };
}

interface OTPVerifyResponse {
    data: {
        verified: boolean;
        message?: string;
    };
}

interface MerchantLite {
    id: string;
    name: string;
}

interface MerchantsResponse {
    data: MerchantLite[];
}

// ============================================
// CONSTANTS
// ============================================

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
}

function convertRupeesToPaisa(rupees: number): number {
    return Math.round(rupees * 100);
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Order Summary Card
 */
interface OrderSummaryProps {
    merchantName: string;
    amount: string;
    onAmountChange: (value: string) => void;
    description: string;
    onDescriptionChange: (value: string) => void;
}

function OrderSummary({
    merchantName,
    amount,
    onAmountChange,
    description,
    onDescriptionChange
}: OrderSummaryProps): React.ReactElement {
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
            onAmountChange(val);
        }
    };

    return (
        <div
            className="rounded-xl p-6 mb-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}
        >
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                Order Summary
            </h2>

            <div className="space-y-4">
                {/* Merchant Name */}
                <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1 block">Merchant</label>
                    <p className="text-base font-medium text-[var(--text-primary)]">{merchantName}</p>
                </div>

                {/* Amount Input */}
                <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-2 block">Amount (₹)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[var(--text-primary)]">
                            ₹
                        </span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-lg font-semibold transition-colors-fast"
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
                    </div>
                </div>

                {/* Description Input */}
                <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-2 block">Description (Optional)</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="What's this payment for?"
                        className="w-full px-4 py-3 rounded-lg text-sm transition-colors-fast"
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
                </div>
            </div>
        </div>
    );
}

/**
 * Balance Check Section
 */
interface BalanceCheckProps {
    availableBalance: number;
    requiredAmount: number;
}

function BalanceCheck({ availableBalance, requiredAmount }: BalanceCheckProps): React.ReactElement {
    const isSufficient = availableBalance >= requiredAmount;
    const shortfall = requiredAmount - availableBalance;

    return (
        <div
            className="rounded-xl p-4 mb-6 flex items-center gap-3"
            style={{
                backgroundColor: isSufficient ? 'var(--green-muted)' : 'var(--red-muted)',
                border: `1px solid ${isSufficient ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            }}
        >
            {isSufficient ? (
                <>
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--green)' }} />
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--green)' }}>
                            Balance sufficient
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                            Available: {formatCurrency(availableBalance)}
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--red)' }} />
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--red)' }}>
                            Insufficient balance
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                            You need {formatCurrency(shortfall)} more
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Error Display Component
 */
function ErrorDisplay({ message }: { message: string }): React.ReactElement {
    return (
        <div
            className="rounded-xl p-4 mb-6 flex items-center gap-3"
            style={{
                backgroundColor: 'var(--red-muted)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
        >
            <ShieldAlert className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--red)' }} />
            <p className="text-sm" style={{ color: 'var(--red)' }}>
                {message}
            </p>
        </div>
    );
}

// ============================================
// MAIN CHECKOUT PAGE
// ============================================

export default function CheckoutPage(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userId } = useAuthStore();
    const wallet = useWalletStore((state) => state.wallet);

    // URL params
    const merchantIdFromQuery = searchParams.get('merchantId') || '';
    const merchantNameFromQuery = searchParams.get('merchantName') || '';
    const prefilledAmount = searchParams.get('amount') || '';

    const [resolvedMerchantId, setResolvedMerchantId] = useState(merchantIdFromQuery);
    const [resolvedMerchantName, setResolvedMerchantName] = useState(merchantNameFromQuery || 'Merchant');

    // Form state
    const [amount, setAmount] = useState(prefilledAmount);
    const [description, setDescription] = useState('');

    // Payment flow state
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [flagReason, setFlagReason] = useState('');

    // PayU form ref
    const payuFormRef = useRef<HTMLFormElement>(null);
    const [payuParams, setPayuParams] = useState<Record<string, string> | null>(null);

    const availableBalance = wallet?.availableRupees ?? 0;
    const amountValue = parseFloat(amount) || 0;
    const isSufficient = availableBalance >= amountValue && amountValue > 0;

    useEffect(() => {
        let cancelled = false;

        const ensureMerchant = async (): Promise<void> => {
            if (merchantIdFromQuery) {
                setResolvedMerchantId(merchantIdFromQuery);
                setResolvedMerchantName(merchantNameFromQuery || 'Merchant');
                return;
            }

            // No merchant selected - user must select from merchants page
            // Don't auto-select first merchant (security/UX issue)
            if (!cancelled) {
                setError('Please select a merchant from the merchants page to continue.');
            }
        };

        ensureMerchant();

        return () => {
            cancelled = true;
        };
    }, [merchantIdFromQuery, merchantNameFromQuery]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Handle fraud check and payment flow
    const handlePay = useCallback(async () => {
        if (!isSufficient || !userId || !resolvedMerchantId) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Step 1: Fraud Check
            const fraudResponse = await apiPost<FraudCheckResponse>('/api/fraud/check', {
                amountPaisa: convertRupeesToPaisa(amountValue),
                merchantId: resolvedMerchantId,
                merchantName: resolvedMerchantName,
            });

            const action = fraudResponse.data?.action;

            if (action === 'BLOCK') {
                setError(`Transaction blocked. ${fraudResponse.data?.reason || 'Please try again later.'}`);
                setIsProcessing(false);
                return;
            }

            if (action === 'FREEZE') {
                setError('Account frozen due to suspicious activity. Contact support.');
                setIsProcessing(false);
                return;
            }

            if (action === 'REQUIRE_OTP') {
                // Generate OTP
                const otpResponse = await apiPost<{ data: { otp: string; reason: string } }>('/api/fraud/otp/generate', {
                    userId,
                });

                setOtpCode(otpResponse.data?.otp || '');
                setFlagReason(otpResponse.data?.reason || 'Additional verification required');
                setShowOtpModal(true);
                setIsProcessing(false);
                return;
            }

            if (action === 'ALLOW') {
                // Proceed to PayU
                await initiatePayU();
            } else {
                setError('Unexpected response from fraud check. Please try again.');
                setIsProcessing(false);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Payment processing failed';
            setError(message);
            setIsProcessing(false);
        }
    }, [isSufficient, userId, resolvedMerchantId, amountValue]);

    // Initiate PayU payment
    const initiatePayU = useCallback(async () => {
        if (!userId) return;

        try {
            const response = await apiPost<PayUInitiateResponse>('/api/payu/initiate', {
                userId,
                amountPaisa: convertRupeesToPaisa(amountValue),
                merchantId: resolvedMerchantId,
                merchantName: resolvedMerchantName,
                productInfo: description || `Payment at ${resolvedMerchantName}`,
            });

            const params = response.payuParams ?? response.data?.formParams;

            if (params) {
                setPayuParams(params);
            } else {
                setError('Failed to initialize payment gateway');
                setIsProcessing(false);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to connect to payment gateway';
            setError(message);
            setIsProcessing(false);
        }
    }, [userId, amountValue, resolvedMerchantId, resolvedMerchantName, description]);

    // Auto-submit PayU form when params are set
    useEffect(() => {
        if (payuParams && payuFormRef.current) {
            payuFormRef.current.submit();
        }
    }, [payuParams]);

    // Handle OTP verification
    const handleOtpVerify = useCallback(async (code: string): Promise<{ verified: boolean; attemptsRemaining?: number }> => {
        if (!userId) return { verified: false };

        try {
            const response = await apiPost<OTPVerifyResponse>('/api/fraud/otp/verify', {
                userId,
                code,
            });

            return { verified: response.data?.verified || false };
        } catch {
            return { verified: false, attemptsRemaining: 2 };
        }
    }, [userId]);

    // Handle OTP success
    const handleOtpSuccess = useCallback(() => {
        setShowOtpModal(false);
        initiatePayU();
    }, [initiatePayU]);

    // Handle OTP cancel
    const handleOtpCancel = useCallback(() => {
        setShowOtpModal(false);
        setIsProcessing(false);
    }, []);

    // Handle request new OTP
    const handleRequestNewCode = useCallback(async (): Promise<string> => {
        if (!userId) return '';

        try {
            const response = await apiPost<{ data: { otp: string } }>('/api/fraud/otp/generate', {
                userId,
            });
            const newOtp = response.data?.otp || '';
            setOtpCode(newOtp);
            return newOtp;
        } catch {
            return '';
        }
    }, [userId]);

    // PayU form element
    const payuFormElement = payuParams ? (
        <form
            ref={payuFormRef}
            action="https://test.payu.in/_payment"
            method="POST"
            style={{ display: 'none' }}
        >
            {Object.entries(payuParams).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
            ))}
        </form>
    ) : null;

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
                Back
            </button>

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    Checkout
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    Complete your payment securely
                </p>
            </div>

            {/* Order Summary */}
            <OrderSummary
                merchantName={resolvedMerchantName}
                amount={amount}
                onAmountChange={setAmount}
                description={description}
                onDescriptionChange={setDescription}
            />

            {/* Balance Check */}
            {amountValue > 0 && (
                <BalanceCheck
                    availableBalance={availableBalance}
                    requiredAmount={amountValue}
                />
            )}

            {/* Error Display */}
            {error && <ErrorDisplay message={error} />}

            {/* Pay Button */}
            <button
                onClick={handlePay}
                disabled={!isSufficient || isProcessing}
                className="w-full py-4 rounded-xl font-semibold text-base transition-all-fast flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    backgroundColor: isSufficient && !isProcessing ? 'var(--gold)' : 'var(--bg-border)',
                    color: 'var(--text-inverse)',
                }}
                onMouseEnter={(e) => {
                    if (isSufficient && !isProcessing) {
                        e.currentTarget.style.backgroundColor = 'var(--gold-hover)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (isSufficient && !isProcessing) {
                        e.currentTarget.style.backgroundColor = 'var(--gold)';
                    }
                }}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Securing your payment...
                    </>
                ) : (
                    <>
                        <Wallet className="w-5 h-5" />
                        Pay with GrabCash
                    </>
                )}
            </button>

            {/* Hidden PayU Form */}
            {payuFormElement}

            {/* OTP Modal */}
            <OtpModal
                isOpen={showOtpModal}
                flagReason={flagReason}
                otpCode={otpCode}
                onVerify={handleOtpVerify}
                onCancel={handleOtpCancel}
                onSuccess={handleOtpSuccess}
                onRequestNewCode={handleRequestNewCode}
            />
        </div>
    );
}
