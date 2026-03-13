// ============================================
// TEST OTP MODAL PAGE
// Interactive demo and testing for OTP modal
// ============================================

'use client';

import React, { useState, useCallback } from 'react';
import { OtpModal } from '@/components/features/fraud';

// ============================================
// MOCK DATA
// ============================================

const MOCK_OTP = '123456';
const MOCK_FLAG_REASON = 'Transaction within 90 seconds of credit';

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function TestOtpModalPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [otpCode, setOtpCode] = useState(MOCK_OTP);
    const [lastAction, setLastAction] = useState<string>('');
    const [simulateWrong, setSimulateWrong] = useState(false);

    // Open modal
    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setLastAction('Modal opened');
    }, []);

    // Close modal
    const handleCancel = useCallback(() => {
        setIsOpen(false);
        setLastAction('Transaction cancelled by user');
    }, []);

    // Verify OTP
    const handleVerify = useCallback(
        async (code: string) => {
            setLastAction(`Verifying code: ${code}...`);

            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (simulateWrong) {
                setLastAction(`Code ${code} rejected (simulating wrong code)`);
                return { verified: false, attemptsRemaining: 2 };
            }

            if (code === otpCode) {
                setLastAction(`Code ${code} verified successfully!`);
                return { verified: true };
            } else {
                setLastAction(`Code ${code} rejected`);
                return { verified: false, attemptsRemaining: 2 };
            }
        },
        [otpCode, simulateWrong]
    );

    // Success callback
    const handleSuccess = useCallback(() => {
        setLastAction('Transaction approved! Proceeding...');
        setTimeout(() => {
            setIsOpen(false);
        }, 500);
    }, []);

    // Request new code
    const handleRequestNewCode = useCallback(async (): Promise<string> => {
        setLastAction('Requesting new code...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpCode(newCode);
        setLastAction(`New code generated: ${newCode}`);
        return newCode;
    }, []);

    // Toggle simulate wrong
    const toggleSimulateWrong = useCallback(() => {
        setSimulateWrong((prev) => !prev);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--gold)]">
                    Test: OTP Modal Component
                </h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                    Step 10 — Fraud OTP Modal Component
                </p>
            </div>

            {/* Controls */}
            <div className="mb-8 space-y-4">
                <button
                    onClick={handleOpen}
                    className="rounded-lg bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--bg-primary)] transition-colors hover:bg-[var(--gold-hover)]"
                >
                    Open OTP Modal
                </button>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="simulateWrong"
                        checked={simulateWrong}
                        onChange={toggleSimulateWrong}
                        className="h-4 w-4 rounded border-[var(--bg-border)] bg-[var(--bg-primary)] text-[var(--gold)]"
                    />
                    <label
                        htmlFor="simulateWrong"
                        className="text-sm text-[var(--text-secondary)]"
                    >
                        Simulate wrong code (for testing error states)
                    </label>
                </div>
            </div>

            {/* Last Action */}
            {lastAction && (
                <div className="mb-8 rounded-lg border border-[var(--green)] bg-[var(--green)]/10 px-4 py-3 text-sm text-[var(--green)]">
                    Last Action: {lastAction}
                </div>
            )}

            {/* Features List */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Component Features
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Orange shield icon with security message</li>
                        <li>• Flag reason display (amber background)</li>
                        <li>• Large 6-digit OTP display (monospace)</li>
                        <li>• Countdown timer (5 minutes, red under 1 min)</li>
                        <li>• 6 individual digit input boxes</li>
                    </ul>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Interactive Features
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Auto-advance to next input on digit entry</li>
                        <li>• Backspace moves to previous input</li>
                        <li>• Paste support (6 digits fills all boxes)</li>
                        <li>• Verify button (disabled until complete)</li>
                        <li>• Cancel Transaction button</li>
                    </ul>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Error States
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Wrong code: shake animation + red border</li>
                        <li>• 3 wrong attempts: account frozen</li>
                        <li>• Expired: request new code button</li>
                        <li>• Attempts remaining counter</li>
                    </ul>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Success State
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Green checkmark bounce animation</li>
                        <li>• "Transaction Approved" message</li>
                        <li>• Auto-closes after 2 seconds</li>
                        <li>• Proceeds with original payment flow</li>
                    </ul>
                </div>
            </div>

            {/* Test Scenarios */}
            <div className="mt-8 rounded-lg bg-[var(--bg-card)] p-6">
                <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
                    Test Scenarios
                </h3>
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                    <p>
                        <strong className="text-[var(--text-primary)]">
                            1. Happy Path:
                        </strong>{' '}
                        Open modal → Enter correct OTP ({otpCode}) → See success
                        animation → Auto-close
                    </p>
                    <p>
                        <strong className="text-[var(--text-primary)]">
                            2. Wrong Code:
                        </strong>{' '}
                        Check "Simulate wrong code" → Enter any code → See shake
                        animation + error message → Try again
                    </p>
                    <p>
                        <strong className="text-[var(--text-primary)]">
                            3. Expired Code:
                        </strong>{' '}
                        Wait 5 minutes (or check code to see expired state) → Click
                        "Request new code" → New OTP generated
                    </p>
                    <p>
                        <strong className="text-[var(--text-primary)]">
                            4. Paste Support:
                        </strong>{' '}
                        Copy 6 digits → Click first input → Paste → All boxes filled
                        automatically
                    </p>
                </div>
            </div>

            {/* OTP Modal */}
            <OtpModal
                isOpen={isOpen}
                flagReason={MOCK_FLAG_REASON}
                otpCode={otpCode}
                onVerify={handleVerify}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                onRequestNewCode={handleRequestNewCode}
            />
        </div>
    );
}
