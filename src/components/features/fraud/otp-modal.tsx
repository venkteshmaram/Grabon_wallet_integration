// ============================================
// OTP MODAL COMPONENT - Fraud Verification
// Step 10: Fraud OTP Modal Component
// ============================================

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Shield, CheckCircle, RefreshCw } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface OtpModalProps {
    /** Whether modal is open */
    isOpen: boolean;
    /** Reason for fraud flag */
    flagReason: string;
    /** The generated OTP code to display */
    otpCode: string;
    /** Callback when user verifies */
    onVerify: (code: string) => Promise<{
        verified: boolean;
        attemptsRemaining?: number;
    }>;
    /** Callback when user cancels */
    onCancel: () => void;
    /** Callback when verification succeeds */
    onSuccess: () => void;
    /** Callback to request new OTP */
    onRequestNewCode: () => Promise<string>;
}

// ============================================
// CONSTANTS
// ============================================

const OTP_LENGTH = 6;
const INITIAL_TIME = 300; // 5 minutes in seconds
const WARNING_THRESHOLD = 60; // Turn red under 1 minute
const MAX_ATTEMPTS = 3;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// SUCCESS VIEW COMPONENT
// ============================================

function SuccessView(): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="checkmark-bounce mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--green)]">
                <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[var(--green)]">Transaction Approved</h3>
        </div>
    );
}

// ============================================
// MAIN OTP MODAL COMPONENT
// ============================================

export function OtpModal({
    isOpen,
    flagReason,
    otpCode,
    onVerify,
    onCancel,
    onSuccess,
    onRequestNewCode,
}: OtpModalProps): React.ReactElement | null {
    // State
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [timeRemaining, setTimeRemaining] = useState(INITIAL_TIME);
    const [isExpired, setIsExpired] = useState(false);
    const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS);
    const [isFrozen, setIsFrozen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isShaking, setIsShaking] = useState(false);
    const [currentOtp, setCurrentOtp] = useState(otpCode);

    // Refs
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Focus first input on open
    useEffect(() => {
        if (isOpen && !isSuccess && !isFrozen) {
            inputRefs.current[0]?.focus();
        }
    }, [isOpen, isSuccess, isFrozen]);

    // Countdown timer
    useEffect(() => {
        if (!isOpen || isExpired || isSuccess || isFrozen) return;

        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    setIsExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isOpen, isExpired, isSuccess, isFrozen]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setDigits(Array(OTP_LENGTH).fill(''));
            setTimeRemaining(INITIAL_TIME);
            setIsExpired(false);
            setAttemptsRemaining(MAX_ATTEMPTS);
            setIsFrozen(false);
            setIsVerifying(false);
            setIsSuccess(false);
            setErrorMessage(null);
            setIsShaking(false);
            setCurrentOtp(otpCode);
        }
    }, [isOpen, otpCode]);

    // Handle digit input
    const handleDigitChange = useCallback(
        (index: number, value: string) => {
            if (isFrozen || isExpired || isVerifying) return;

            // Only allow single digit
            const digit = value.slice(-1);
            if (!/^\d*$/.test(digit)) return;

            const newDigits = [...digits];
            newDigits[index] = digit;
            setDigits(newDigits);
            setErrorMessage(null);

            // Auto-advance to next input
            if (digit && index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        },
        [digits, isFrozen, isExpired, isVerifying]
    );

    // Handle key down
    const handleKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace') {
                if (!digits[index] && index > 0) {
                    // Move to previous input if current is empty
                    inputRefs.current[index - 1]?.focus();
                } else {
                    // Clear current input
                    const newDigits = [...digits];
                    newDigits[index] = '';
                    setDigits(newDigits);
                }
            } else if (e.key === 'ArrowLeft' && index > 0) {
                inputRefs.current[index - 1]?.focus();
            } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        },
        [digits]
    );

    // Handle paste
    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            e.preventDefault();
            if (isFrozen || isExpired || isVerifying) return;

            const pastedData = e.clipboardData.getData('text');
            const digitsOnly = pastedData.replace(/\D/g, '').slice(0, OTP_LENGTH);

            if (digitsOnly.length === OTP_LENGTH) {
                const newDigits = digitsOnly.split('');
                setDigits(newDigits);
                inputRefs.current[OTP_LENGTH - 1]?.focus();
                setErrorMessage(null);
            }
        },
        [isFrozen, isExpired, isVerifying]
    );

    // Handle verify
    const handleVerify = useCallback(async () => {
        if (isFrozen || isExpired || isVerifying) return;

        const enteredCode = digits.join('');
        if (enteredCode.length !== OTP_LENGTH) return;

        setIsVerifying(true);
        setErrorMessage(null);

        try {
            const result = await onVerify(enteredCode);

            if (result.verified) {
                setIsSuccess(true);
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                const remaining = result.attemptsRemaining ?? attemptsRemaining - 1;
                setAttemptsRemaining(remaining);

                if (remaining <= 0) {
                    setIsFrozen(true);
                } else {
                    setErrorMessage(`Incorrect code. ${remaining} attempts remaining`);
                    setIsShaking(true);
                    setTimeout(() => setIsShaking(false), 500);
                    // Clear inputs
                    setDigits(Array(OTP_LENGTH).fill(''));
                    inputRefs.current[0]?.focus();
                }
            }
        } catch {
            setErrorMessage('Verification failed. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    }, [digits, isFrozen, isExpired, isVerifying, attemptsRemaining, onVerify, onSuccess]);

    // Handle request new code
    const handleRequestNewCode = useCallback(async () => {
        try {
            const newOtp = await onRequestNewCode();
            setCurrentOtp(newOtp);
            setTimeRemaining(INITIAL_TIME);
            setIsExpired(false);
            setDigits(Array(OTP_LENGTH).fill(''));
            setErrorMessage(null);
            inputRefs.current[0]?.focus();
        } catch {
            setErrorMessage('Failed to generate new code. Please try again.');
        }
    }, [onRequestNewCode]);

    // Check if all digits are entered
    const isComplete = digits.every((d) => d !== '');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70"
                onClick={!isVerifying && !isSuccess ? onCancel : undefined}
            />

            {/* Modal Card */}
            <div
                className={`relative w-full max-w-[400px] rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-8 shadow-2xl ${isShaking ? 'shake-animation' : ''
                    }`}
            >
                {isSuccess ? (
                    <SuccessView />
                ) : (
                    <>
                        {/* Top Section */}
                        <div className="mb-6 text-center">
                            <div className="mb-4 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F59E0B]/10">
                                    <Shield className="h-8 w-8 text-[#F59E0B]" />
                                </div>
                            </div>
                            <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
                                Security Verification Required
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)]">
                                A suspicious transaction pattern was detected
                            </p>
                        </div>

                        {/* Flag Reason Box */}
                        <div className="mb-6 rounded-lg bg-[#F59E0B]/10 p-3">
                            <p className="text-sm text-[#F59E0B]">{flagReason}</p>
                        </div>

                        {/* OTP Display */}
                        <div className="mb-6 text-center">
                            <p className="mb-2 text-sm text-[var(--text-secondary)]">
                                Your verification code:
                            </p>
                            <p
                                className="font-mono text-5xl font-bold tracking-[8px] text-[var(--gold)]"
                                style={{ fontFamily: "'Courier New', monospace" }}
                            >
                                {currentOtp}
                            </p>
                        </div>

                        {/* Countdown Timer */}
                        <div className="mb-6 text-center">
                            {isExpired ? (
                                <p className="text-sm font-semibold text-[var(--red)]">
                                    Code expired
                                </p>
                            ) : (
                                <p
                                    className={`text-sm ${timeRemaining < WARNING_THRESHOLD
                                            ? 'font-semibold text-[var(--red)]'
                                            : 'text-[var(--text-secondary)]'
                                        }`}
                                >
                                    Expires in {formatTime(timeRemaining)}
                                </p>
                            )}
                        </div>

                        {/* OTP Input Section */}
                        <div className="mb-6">
                            <div className="flex justify-center gap-2">
                                {digits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            inputRefs.current[index] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handleDigitChange(index, e.target.value)
                                        }
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        disabled={isFrozen || isExpired || isVerifying}
                                        className={`h-14 w-12 rounded-md border-2 bg-[var(--bg-primary)] text-center text-2xl font-bold text-[var(--text-primary)] transition-colors focus:outline-none ${errorMessage
                                                ? 'border-[var(--red)]'
                                                : 'border-[var(--bg-border)] focus:border-[var(--gold)]'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mb-4 text-center">
                                <p className="text-sm text-[var(--red)]">{errorMessage}</p>
                            </div>
                        )}

                        {/* Frozen Message */}
                        {isFrozen && (
                            <div className="mb-4 rounded-lg bg-[var(--red-muted)] p-3 text-center">
                                <p className="text-sm font-semibold text-[var(--red)]">
                                    Account frozen. Contact support.
                                </p>
                            </div>
                        )}

                        {/* Expired - Request New Code */}
                        {isExpired && !isFrozen && (
                            <div className="mb-4 text-center">
                                <button
                                    onClick={handleRequestNewCode}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--gold)] transition-colors hover:text-[var(--gold-hover)]"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Request new code
                                </button>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleVerify}
                                disabled={!isComplete || isVerifying || isFrozen || isExpired}
                                className="w-full rounded-lg bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--bg-primary)] transition-colors hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isVerifying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)]" />
                                        Verifying...
                                    </span>
                                ) : (
                                    'Verify'
                                )}
                            </button>
                            <button
                                onClick={onCancel}
                                disabled={isVerifying}
                                className="w-full py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
                            >
                                Cancel Transaction
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Export types
export type { OtpModalProps };
