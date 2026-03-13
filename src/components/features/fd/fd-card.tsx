// ============================================
// FD CARD COMPONENT - Individual Fixed Deposit Card
// Step 8: Investment Portfolio Components
// ============================================

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Landmark, AlertTriangle, X } from 'lucide-react';
import type { FDRecord } from '@/store/wallet-store';

// ============================================
// TYPES
// ============================================

interface FDCardProps {
    /** FD record data */
    fd: FDRecord;
    /** Callback when user confirms break FD */
    onBreak: (fdId: string) => Promise<void>;
    /** Whether break operation is in progress */
    isBreaking: boolean;
}

interface BreakModalProps {
    /** Whether modal is open */
    isOpen: boolean;
    /** FD data for display */
    fd: FDRecord | null;
    /** Callback to close modal */
    onClose: () => void;
    /** Callback to confirm break */
    onConfirm: () => Promise<void>;
    /** Whether break is in progress */
    isBreaking: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const LOCK_PERIOD_DAYS = 7;
const PENALTY_PERCENT = 1;

const STATUS_CONFIG = {
    ACTIVE: {
        label: 'Active',
        bgColor: 'bg-[#22C55E]',
        textColor: 'text-white',
    },
    MATURED: {
        label: 'Matured',
        bgColor: 'bg-[#38BDF8]',
        textColor: 'text-white',
    },
    BROKEN: {
        label: 'Broken',
        bgColor: 'bg-[#EF4444]',
        textColor: 'text-white',
    },
} as const;

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
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Calculate days since FD start
 */
function getDaysSinceStart(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if FD is within lock period
 */
function isWithinLockPeriod(fd: FDRecord): boolean {
    const daysSinceStart = getDaysSinceStart(fd.startDate);
    return daysSinceStart < LOCK_PERIOD_DAYS;
}

/**
 * Calculate progress percentage
 */
function calculateProgress(fd: FDRecord): number {
    const daysSinceStart = getDaysSinceStart(fd.startDate);
    const percentage = (daysSinceStart / fd.tenureDays) * 100;
    return Math.min(Math.max(percentage, 0), 100);
}

// ============================================
// BREAK MODAL COMPONENT
// ============================================

function BreakModal({ isOpen, fd, onClose, onConfirm, isBreaking }: BreakModalProps): React.ReactElement | null {
    if (!isOpen || !fd) return null;

    const penaltyAmount = fd.principal * (PENALTY_PERCENT / 100);
    const receiveAmount = fd.principal + fd.accruedInterest - penaltyAmount;

    const handleConfirm = useCallback(async () => {
        await onConfirm();
    }, [onConfirm]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={!isBreaking ? onClose : undefined}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-[400px] rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6 shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={isBreaking}
                    className="absolute right-4 top-4 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Warning Icon */}
                <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EF4444]/10">
                        <AlertTriangle className="h-8 w-8 text-[#EF4444]" />
                    </div>
                </div>

                {/* Heading */}
                <h3 className="mb-2 text-center text-xl font-bold text-[var(--text-primary)]">
                    Are you sure?
                </h3>
                <p className="mb-6 text-center text-sm text-[var(--text-secondary)]">
                    Breaking this FD early will incur a penalty
                </p>

                {/* Details */}
                <div className="mb-6 space-y-3 rounded-lg bg-[var(--bg-primary)] p-4">
                    <div className="flex justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">Principal</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                            {formatRupees(fd.principal)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">
                            Penalty ({PENALTY_PERCENT}%)
                        </span>
                        <span className="text-sm font-medium text-[#EF4444]">
                            -{formatRupees(penaltyAmount)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">Interest Accrued</span>
                        <span className="text-sm font-medium text-[var(--gold)]">
                            +{formatRupees(fd.accruedInterest)}
                        </span>
                    </div>
                    <div className="border-t border-[var(--bg-border)] pt-3">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                You receive
                            </span>
                            <span className="text-base font-bold text-[#22C55E]">
                                {formatRupees(receiveAmount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isBreaking}
                        className="flex-1 rounded-lg border border-[var(--bg-border)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-primary)] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isBreaking}
                        className="flex-1 rounded-lg bg-[#EF4444] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#DC2626] disabled:opacity-50"
                    >
                        {isBreaking ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Processing...
                            </span>
                        ) : (
                            'Confirm Break'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN FD CARD COMPONENT
// ============================================

export function FDCard({ fd, onBreak, isBreaking }: FDCardProps): React.ReactElement {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const status = STATUS_CONFIG[fd.status];
    const progress = calculateProgress(fd);
    const isLocked = isWithinLockPeriod(fd);

    const handleBreakClick = useCallback(() => {
        setError(null);
        if (isLocked) {
            setError(`Cannot break FD within the first ${LOCK_PERIOD_DAYS} days`);
            return;
        }
        setIsModalOpen(true);
    }, [isLocked]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setError(null);
    }, []);

    const handleConfirmBreak = useCallback(async () => {
        try {
            await onBreak(fd.id);
            setIsModalOpen(false);
            setError(null);
        } catch {
            setError('Failed to break FD. Please try again.');
        }
    }, [fd.id, onBreak]);

    // Format days remaining text
    const daysText = useMemo(() => {
        if (fd.status === 'MATURED') return 'Matured';
        if (fd.status === 'BROKEN') return `Broken on ${formatDate(fd.brokenAt || '')}`;
        if (fd.daysRemaining <= 0) return 'Matures today';
        return `${fd.daysRemaining} days remaining`;
    }, [fd]);

    return (
        <>
            <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-5">
                {/* Header Row */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-[var(--gold)]" />
                        <span className="text-base font-semibold text-[var(--text-primary)]">
                            GrabSave FD
                        </span>
                    </div>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${status.bgColor} ${status.textColor}`}
                    >
                        {status.label}
                    </span>
                </div>

                {/* Principal Amount */}
                <div className="mb-1">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                        {formatRupees(fd.principal)}
                    </span>
                </div>

                {/* Interest Rate */}
                <div className="mb-3">
                    <span className="text-sm font-semibold text-[var(--gold)]">
                        {fd.interestRate}% p.a.
                    </span>
                </div>

                {/* Maturity Info */}
                <div className="mb-2 text-sm text-[var(--text-secondary)]">
                    Matures: {formatDate(fd.maturityDate)} · {daysText}
                </div>

                {/* Projected Return */}
                <div className="mb-1 text-sm">
                    <span className="text-[var(--text-secondary)]">Maturity Amount: </span>
                    <span className="font-medium text-[#22C55E]">
                        {formatRupees(fd.maturityAmount)}
                    </span>
                </div>

                {/* Interest Accrued */}
                <div className="mb-4 text-sm">
                    <span className="text-[var(--text-secondary)]">Interest Accrued: </span>
                    <span className="font-medium text-[var(--gold)]">
                        {formatRupees(fd.accruedInterest)}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--bg-border)]">
                        <div
                            className="h-full rounded-full bg-[var(--gold)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-3 rounded-lg bg-[#EF4444]/10 px-3 py-2 text-xs text-[#EF4444]">
                        {error}
                    </div>
                )}

                {/* Break FD Button - Only for Active FDs */}
                {fd.status === 'ACTIVE' && (
                    <button
                        onClick={handleBreakClick}
                        disabled={isBreaking}
                        className="w-full rounded-lg border border-[#EF4444] bg-transparent px-4 py-2.5 text-sm font-medium text-[#EF4444] transition-colors hover:bg-[#EF4444]/10 disabled:opacity-50"
                    >
                        {isBreaking ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#EF4444]/30 border-t-[#EF4444]" />
                                Processing...
                            </span>
                        ) : (
                            'Break FD'
                        )}
                    </button>
                )}

                {/* Actual Return for Broken FDs */}
                {fd.status === 'BROKEN' && fd.actualReturn !== null && (
                    <div className="rounded-lg bg-[var(--bg-primary)] p-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Actual Return</span>
                            <span className="font-medium text-[var(--text-primary)]">
                                {formatRupees(fd.actualReturn)}
                            </span>
                        </div>
                        {fd.penaltyAmount !== null && fd.penaltyAmount > 0 && (
                            <div className="mt-1 flex justify-between text-xs">
                                <span className="text-[var(--text-secondary)]">Penalty</span>
                                <span className="text-[#EF4444]">
                                    -{formatRupees(fd.penaltyAmount)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Break Modal */}
            <BreakModal
                isOpen={isModalOpen}
                fd={fd}
                onClose={handleCloseModal}
                onConfirm={handleConfirmBreak}
                isBreaking={isBreaking}
            />
        </>
    );
}

// Export types
export type { FDCardProps };
