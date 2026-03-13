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
    ShieldAlert,
    Check
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
    isFlagged?: boolean;
    flagReason?: string;
    fraudAction?: FraudAction;
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
            className="rounded-2xl p-8 mb-6 backdrop-blur-xl border border-zinc-800/50"
            style={{ 
                backgroundColor: 'rgba(15, 15, 15, 0.7)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)' 
            }}
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
    const [useWalletBalance, setUseWalletBalance] = useState(false);

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
    const totalAmountValue = parseFloat(amount) || 0;
    
    // Split logic
    const appliedBalance = useWalletBalance ? Math.min(availableBalance, totalAmountValue) : 0;
    const finalPayUAmount = totalAmountValue - appliedBalance;
    
    const isSufficient = totalAmountValue > 0; // In hybrid mode, we always have "sufficient" balance as PayU handles remainder

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
                amountPaisa: convertRupeesToPaisa(totalAmountValue),
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
                const otpResponse = await apiPost<{ otpCode: string; purpose: string }>('/api/fraud/otp/generate', {
                    userId,
                    purpose: 'FRAUD_VERIFICATION',
                });

                setOtpCode(otpResponse.otpCode || '');
                setFlagReason(fraudResponse.data?.reason || 'Additional verification required');
                setShowOtpModal(true);
                setIsProcessing(false);
                return;
            }

            if (action === 'ALLOW') {
                // Special case: 100% Wallet Payment
                if (finalPayUAmount === 0) {
                    await processDirectWalletPayment();
                    return;
                }
                
                // Proceed to PayU with the final amount after wallet deduction
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
    }, [isSufficient, userId, resolvedMerchantId, totalAmountValue, finalPayUAmount]);

    // Process 100% Wallet Payment (No PayU needed)
    const processDirectWalletPayment = useCallback(async () => {
        if (!userId || !resolvedMerchantId) return;

        try {
            const response = await apiPost<{ success: boolean; txnId: string }>('/api/wallet/pay-direct', {
                userId,
                amountPaisa: convertRupeesToPaisa(totalAmountValue),
                merchantId: resolvedMerchantId,
                merchantName: resolvedMerchantName,
                productInfo: description || `Direct Wallet Payment at ${resolvedMerchantName}`,
            });

            if (response.success) {
                router.push(`/checkout/success?txnId=${response.txnId}`);
            } else {
                setError('Wallet payment failed. Please try again.');
                setIsProcessing(false);
            }
        } catch (err) {
            setError('Failed to process wallet payment');
            setIsProcessing(false);
        }
    }, [userId, totalAmountValue, resolvedMerchantId, resolvedMerchantName, description, router]);

    // Initiate PayU payment
    const initiatePayU = useCallback(async () => {
        if (!userId) return;

        try {
            const response = await apiPost<PayUInitiateResponse>('/api/payu/initiate', {
                userId,
                amountPaisa: convertRupeesToPaisa(finalPayUAmount),
                appliedBalancePaisa: convertRupeesToPaisa(appliedBalance),
                merchantId: resolvedMerchantId,
                merchantName: resolvedMerchantName,
                productInfo: description || `Payment at ${resolvedMerchantName}`,
            });

            // Handle fraud flag during initiation
            if (response.isFlagged && response.fraudAction === 'REQUIRE_OTP') {
                // Generate OTP if not provided
                const otpRes = await apiPost<{ otpCode: string }>('/api/fraud/otp/generate', {
                    userId,
                    purpose: 'FRAUD_VERIFICATION',
                });
                
                setOtpCode(otpRes.otpCode || '');
                setFlagReason(response.flagReason || 'Additional verification required');
                setShowOtpModal(true);
                setIsProcessing(false);
                return;
            }

            if (response.isFlagged) {
                setError(response.flagReason || 'Transaction blocked by fraud detection');
                setIsProcessing(false);
                return;
            }

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
    }, [userId, finalPayUAmount, appliedBalance, resolvedMerchantId, resolvedMerchantName, description]);

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
            const response = await apiPost<{ verified: boolean; message: string }>('/api/fraud/otp/verify', {
                userId,
                code,
                purpose: 'FRAUD_VERIFICATION',
            });

            return { verified: response.verified || false };
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
            const response = await apiPost<{ otpCode: string }>('/api/fraud/otp/generate', {
                userId,
                purpose: 'FRAUD_VERIFICATION',
            });
            const newOtp = response.otpCode || '';
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
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
                    Checkout
                </h1>
                <div className="h-1 w-20 bg-gold mx-auto rounded-full mb-4 shadow-[0_0_15px_rgba(163,230,53,0.5)]" />
                <p className="text-[var(--text-secondary)]">
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

            {/* Wallet Balance Integration */}
            {totalAmountValue > 0 && availableBalance > 0 && (
                <div
                    className="rounded-2xl p-6 mb-6 backdrop-blur-xl border border-zinc-800/50 flex items-center justify-between transition-all duration-300"
                    style={{ 
                        backgroundColor: useWalletBalance ? 'rgba(163, 230, 53, 0.05)' : 'rgba(15, 15, 15, 0.7)',
                        borderColor: useWalletBalance ? 'var(--gold)' : 'rgba(39, 39, 42, 0.5)'
                    }}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full transition-colors ${useWalletBalance ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">Apply GrabCash Balance</p>
                            <p className="text-xs text-[var(--text-secondary)]">Available: {formatCurrency(availableBalance)}</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setUseWalletBalance(!useWalletBalance)}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${useWalletBalance ? 'bg-gold' : 'bg-zinc-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${useWalletBalance ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            )}

            {/* Payment Breakdown */}
            {totalAmountValue > 0 && useWalletBalance && appliedBalance > 0 && (
                <div className="px-6 mb-8 space-y-2 border-l-2 border-gold/30 ml-4 py-2">
                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                        <span>Order Total</span>
                        <span>{formatCurrency(totalAmountValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gold font-medium">
                        <span>Used Rewards</span>
                        <span>- {formatCurrency(appliedBalance)}</span>
                    </div>
                    <div className="flex justify-between text-base text-[var(--text-primary)] font-black pt-2 border-t border-zinc-800">
                        <span>Pay via Card</span>
                        <span className="text-lg">{formatCurrency(finalPayUAmount)}</span>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && <ErrorDisplay message={error} />}

            {/* Pay Button */}
            <button
                onClick={handlePay}
                disabled={!isSufficient || isProcessing}
                className="w-full py-4 rounded-xl font-black text-lg transition-all-fast flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                style={{
                    backgroundColor: isSufficient && !isProcessing ? 'var(--gold)' : 'var(--bg-border)',
                    color: 'var(--text-inverse)',
                    boxShadow: isSufficient && !isProcessing ? '0 10px 20px -5px rgba(163,230,53,0.3)' : 'none'
                }}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        SECURELY PROCESSING...
                    </>
                ) : (
                    <>
                        {finalPayUAmount === 0 ? <Check className="w-6 h-6" /> : <Wallet className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                        {finalPayUAmount === 0 ? 'CONFIRM WITH GRABCASH' : `PAY ${formatCurrency(finalPayUAmount)} WITH CARD`}
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
