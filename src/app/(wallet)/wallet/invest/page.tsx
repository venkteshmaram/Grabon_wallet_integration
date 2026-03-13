// ============================================
// INVEST PAGE - FD Creation Form with Live Preview
// Step 12: Wallet Pages - Production Grade
// ============================================

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useWallet } from '@/hooks/use-wallet';
import { useFdPortfolio } from '@/hooks/use-fd-portfolio';
import { Landmark, AlertCircle, CheckCircle2, Loader2, ArrowLeft, TrendingUp, Calendar, Percent } from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

const INTEREST_RATE = 7.5; // 7.5% p.a.
const MIN_INVESTMENT = 500;
const MAX_TENURE = 365;
const MIN_TENURE = 30;

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const TENURE_MARKS = [30, 90, 180, 365];

// ============================================
// TYPES
// ============================================

type FormError = {
    amount?: string;
    general?: string;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
}

function calculateMaturityAmount(principal: number, tenureDays: number): number {
    return principal * (1 + (INTEREST_RATE * tenureDays) / 36500);
}

function calculateInterestEarned(principal: number, tenureDays: number): number {
    return calculateMaturityAmount(principal, tenureDays) - principal;
}

function calculateMaturityDate(tenureDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + tenureDays);
    return date;
}

function formatMaturityDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Amount Input Component
 */
interface AmountInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    maxAmount: number;
}

function AmountInput({ value, onChange, error, maxAmount }: AmountInputProps): React.ReactElement {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Only allow numbers and decimal point
        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
            onChange(val);
        }
    }, [onChange]);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
                Investment Amount (₹)
            </label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[var(--text-primary)]">
                    ₹
                </span>
                <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 rounded-xl text-xl font-semibold transition-colors-fast"
                    style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: `2px solid ${error ? 'var(--red)' : 'var(--bg-border)'}`,
                        color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                        if (!error) e.currentTarget.style.borderColor = 'var(--gold)';
                        e.currentTarget.style.outline = 'none';
                    }}
                    onBlur={(e) => {
                        if (!error) e.currentTarget.style.borderColor = 'var(--bg-border)';
                    }}
                />
            </div>

            {/* Helper Text / Error */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-secondary)]">
                    Minimum ₹{MIN_INVESTMENT.toLocaleString('en-IN')}
                </p>
                <button
                    onClick={() => onChange(Math.floor(maxAmount).toString())}
                    className="text-xs font-medium transition-colors-fast"
                    style={{ color: 'var(--gold)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--gold)'; }}
                >
                    Max
                </button>
            </div>

            {error && (
                <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--red)' }}>
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * Tenure Slider Component
 */
interface TenureSliderProps {
    value: number;
    onChange: (value: number) => void;
}

function TenureSlider({ value, onChange }: TenureSliderProps): React.ReactElement {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Tenure (days)
                </label>
                <span className="text-lg font-semibold" style={{ color: 'var(--gold)' }}>
                    {value} days
                </span>
            </div>

            <div className="relative pt-2 pb-6">
                <input
                    type="range"
                    min={MIN_TENURE}
                    max={MAX_TENURE}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, var(--gold) 0%, var(--gold) ${((value - MIN_TENURE) / (MAX_TENURE - MIN_TENURE)) * 100}%, var(--bg-border) ${((value - MIN_TENURE) / (MAX_TENURE - MIN_TENURE)) * 100}%, var(--bg-border) 100%)`,
                    }}
                />

                {/* Tick Marks */}
                <div className="flex justify-between mt-2 px-1">
                    {TENURE_MARKS.map((mark) => (
                        <button
                            key={mark}
                            onClick={() => onChange(mark)}
                            className="text-xs font-medium transition-colors-fast"
                            style={{
                                color: value === mark ? 'var(--gold)' : 'var(--text-tertiary)',
                            }}
                            onMouseEnter={(e) => {
                                if (value !== mark) e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            onMouseLeave={(e) => {
                                if (value !== mark) e.currentTarget.style.color = 'var(--text-tertiary)';
                            }}
                        >
                            {mark === 365 ? '1Y' : `${mark}D`}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Live Preview Card Component
 */
interface LivePreviewProps {
    principal: number;
    tenureDays: number;
}

function LivePreview({ principal, tenureDays }: LivePreviewProps): React.ReactElement {
    const maturityAmount = useMemo(() => calculateMaturityAmount(principal, tenureDays), [principal, tenureDays]);
    const interestEarned = useMemo(() => calculateInterestEarned(principal, tenureDays), [principal, tenureDays]);
    const maturityDate = useMemo(() => calculateMaturityDate(tenureDays), [tenureDays]);

    const hasValidInput = principal >= MIN_INVESTMENT;

    return (
        <div
            className="rounded-xl p-6 space-y-5"
            style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--bg-border)',
            }}
        >
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                Live Preview
            </h3>

            <div className="space-y-4">
                {/* Interest Rate */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Percent className="w-4 h-4" />
                        <span className="text-sm">Interest Rate</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                        {INTEREST_RATE}% p.a.
                    </span>
                </div>

                {/* Maturity Date */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Maturity Date</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                        {hasValidInput ? formatMaturityDate(maturityDate) : '-'}
                    </span>
                </div>

                {/* Interest Earned */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Interest Earned</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                        {hasValidInput ? formatCurrency(interestEarned) : '-'}
                    </span>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--bg-border)] pt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                            Maturity Amount
                        </span>
                        <span className="text-2xl font-bold" style={{ color: 'var(--green)' }}>
                            {hasValidInput ? formatCurrency(maturityAmount) : '-'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Success Modal Component
 */
interface SuccessModalProps {
    principal: number;
    tenureDays: number;
    onClose: () => void;
}

function SuccessModal({ principal, tenureDays, onClose }: SuccessModalProps): React.ReactElement {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div
                className="rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--gold-border)',
                }}
            >
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'var(--green-muted)' }}
                >
                    <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--green)' }} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    FD Created Successfully!
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    ₹{principal.toLocaleString('en-IN')} locked for {tenureDays} days
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                    Redirecting to dashboard...
                </p>
            </div>
        </div>
    );
}

// ============================================
// MAIN INVEST PAGE
// ============================================

export default function InvestPage(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, userId } = useAuthStore();

    // Get pre-fill amount from URL query param
    const prefillAmount = searchParams.get('amount');

    // Local state
    const [amount, setAmount] = useState(prefillAmount || '');
    const [tenureDays, setTenureDays] = useState(90);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<FormError>({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdFD, setCreatedFD] = useState<{ principal: number; tenureDays: number } | null>(null);

    // Load wallet data
    const { wallet, isLoading: walletLoading } = useWallet(userId || '');

    // Load FD portfolio actions
    const { createFD } = useFdPortfolio(userId || '');

    const availableBalance = wallet?.availableRupees ?? 0;
    const principalValue = parseFloat(amount) || 0;

    // Validation
    const validation = useMemo(() => {
        const errors: FormError = {};

        if (amount && principalValue < MIN_INVESTMENT) {
            errors.amount = `Minimum investment is ₹${MIN_INVESTMENT.toLocaleString('en-IN')}`;
        }

        if (amount && principalValue > availableBalance) {
            errors.amount = 'Exceeds available balance';
        }

        return errors;
    }, [amount, principalValue, availableBalance]);

    // Update error state when validation changes
    useEffect(() => {
        setError(validation);
    }, [validation]);

    // Check if form is valid
    const isFormValid = useMemo(() => {
        return principalValue >= MIN_INVESTMENT &&
            principalValue <= availableBalance &&
            !walletLoading;
    }, [principalValue, availableBalance, walletLoading]);

    // Handle form submission
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid || !userId) return;

        setIsSubmitting(true);
        setError({});

        try {
            const result = await createFD(principalValue, tenureDays);

            if (result) {
                setCreatedFD({ principal: principalValue, tenureDays });
                setShowSuccess(true);
            } else {
                setError({ general: 'Failed to create FD. Please try again.' });
            }
        } catch (err) {
            setError({
                general: err instanceof Error ? err.message : 'An unexpected error occurred'
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [isFormValid, userId, principalValue, tenureDays, createFD]);

    // Handle success modal close
    const handleSuccessClose = useCallback(() => {
        setShowSuccess(false);
        router.push('/dashboard');
    }, [router]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Auth guard
    if (!isAuthenticated) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--gold)] border-t-transparent" />
                    <span className="text-sm text-[var(--text-secondary)]">Checking authentication...</span>
                </div>
            </div>
        );
    }

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
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--gold-muted)' }}
                    >
                        <Landmark className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Create GrabSave FD
                    </h1>
                </div>
                <p className="text-sm text-[var(--text-secondary)] ml-[52px]">
                    Lock your funds and earn {INTEREST_RATE}% p.a. interest
                </p>
            </div>

            {/* Available Balance Display */}
            <div
                className="rounded-xl p-4 mb-6 flex items-center justify-between"
                style={{
                    backgroundColor: 'var(--green-muted)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                }}
            >
                <span className="text-sm text-[var(--text-secondary)]">Available Balance</span>
                <span className="text-lg font-bold" style={{ color: 'var(--green)' }}>
                    {walletLoading ? 'Loading...' : formatCurrency(availableBalance)}
                </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Input */}
                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    error={error.amount}
                    maxAmount={availableBalance}
                />

                {/* Tenure Slider */}
                <TenureSlider
                    value={tenureDays}
                    onChange={setTenureDays}
                />

                {/* Live Preview */}
                <LivePreview
                    principal={principalValue}
                    tenureDays={tenureDays}
                />

                {/* General Error */}
                {error.general && (
                    <div
                        className="rounded-lg p-4 flex items-center gap-3"
                        style={{
                            backgroundColor: 'var(--red-muted)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--red)' }} />
                        <p className="text-sm" style={{ color: 'var(--red)' }}>
                            {error.general}
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="w-full py-4 rounded-xl font-semibold text-base transition-all-fast flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: isFormValid && !isSubmitting ? 'var(--gold)' : 'var(--bg-border)',
                        color: 'var(--text-inverse)',
                    }}
                    onMouseEnter={(e) => {
                        if (isFormValid && !isSubmitting) {
                            e.currentTarget.style.backgroundColor = 'var(--gold-hover)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (isFormValid && !isSubmitting) {
                            e.currentTarget.style.backgroundColor = 'var(--gold)';
                        }
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating your FD...
                        </>
                    ) : (
                        'Lock in GrabSave FD'
                    )}
                </button>

                {/* Disclaimer */}
                <p className="text-xs text-center text-[var(--text-tertiary)]">
                    By creating this FD, you agree to lock your funds for {tenureDays} days.
                    Early withdrawal may incur a penalty.
                </p>
            </form>

            {/* Success Modal */}
            {showSuccess && createdFD && (
                <SuccessModal
                    principal={createdFD.principal}
                    tenureDays={createdFD.tenureDays}
                    onClose={handleSuccessClose}
                />
            )}
        </div>
    );
}
