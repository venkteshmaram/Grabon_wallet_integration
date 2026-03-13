// ============================================
// TEST FD PORTFOLIO PAGE
// Interactive demo and testing for FD components
// ============================================

'use client';

import React, { useState, useCallback } from 'react';
import { FDPortfolio } from '@/components/features/fd';
import type { FDRecord } from '@/store/wallet-store';

// ============================================
// MOCK DATA
// ============================================

const MOCK_FDS: FDRecord[] = [
    {
        id: 'fd_001',
        principal: 5000,
        interestRate: 7.5,
        tenureDays: 30,
        maturityAmount: 5030.82,
        interestEarned: 30.82,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        maturityDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        status: 'ACTIVE',
        accruedInterest: 15.41,
        daysRemaining: 15,
        penaltyAmount: null,
        actualReturn: null,
        brokenAt: null,
    },
    {
        id: 'fd_002',
        principal: 10000,
        interestRate: 7.5,
        tenureDays: 90,
        maturityAmount: 10184.93,
        interestEarned: 184.93,
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        maturityDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        status: 'ACTIVE',
        accruedInterest: 92.46,
        daysRemaining: 45,
        penaltyAmount: null,
        actualReturn: null,
        brokenAt: null,
    },
    {
        id: 'fd_003',
        principal: 2500,
        interestRate: 7.5,
        tenureDays: 30,
        maturityAmount: 2515.41,
        interestEarned: 15.41,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
        maturityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'MATURED',
        accruedInterest: 15.41,
        daysRemaining: 0,
        penaltyAmount: null,
        actualReturn: null,
        brokenAt: null,
    },
    {
        id: 'fd_004',
        principal: 3000,
        interestRate: 7.5,
        tenureDays: 30,
        maturityAmount: 3018.49,
        interestEarned: 18.49,
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        maturityDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        status: 'BROKEN',
        accruedInterest: 12.33,
        daysRemaining: 10,
        penaltyAmount: 30,
        actualReturn: 2982.33,
        brokenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
];

// FD within 7-day lock period
const LOCKED_FD: FDRecord = {
    id: 'fd_005',
    principal: 5000,
    interestRate: 7.5,
    tenureDays: 30,
    maturityAmount: 5030.82,
    interestEarned: 30.82,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago (within lock)
    maturityDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    accruedInterest: 3.08,
    daysRemaining: 27,
    penaltyAmount: null,
    actualReturn: null,
    brokenAt: null,
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function TestFDPortfolioPage(): React.ReactElement {
    const [fds, setFds] = useState<FDRecord[]>(MOCK_FDS);
    const [isLoading, setIsLoading] = useState(false);
    const [isBreaking, setIsBreaking] = useState(false);
    const [lastAction, setLastAction] = useState<string>('');

    // Simulate breaking an FD
    const handleBreakFD = useCallback(async (fdId: string): Promise<void> => {
        setIsBreaking(true);
        setLastAction(`Breaking FD ${fdId}...`);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update the FD status to BROKEN
        setFds((prev) =>
            prev.map((fd) =>
                fd.id === fdId
                    ? {
                        ...fd,
                        status: 'BROKEN',
                        brokenAt: new Date().toISOString(),
                        penaltyAmount: fd.principal * 0.01,
                        actualReturn:
                            fd.principal +
                            fd.accruedInterest -
                            fd.principal * 0.01,
                    }
                    : fd
            )
        );

        setIsBreaking(false);
        setLastAction(`FD ${fdId} broken successfully!`);
    }, []);

    // Toggle loading state
    const toggleLoading = useCallback(() => {
        setIsLoading((prev) => !prev);
    }, []);

    // Toggle empty state
    const toggleEmpty = useCallback(() => {
        setFds((prev) => (prev.length > 0 ? [] : MOCK_FDS));
    }, []);

    // Add locked FD
    const addLockedFD = useCallback(() => {
        setFds((prev) => {
            const exists = prev.find((fd) => fd.id === LOCKED_FD.id);
            if (exists) return prev;
            return [...prev, LOCKED_FD];
        });
    }, []);

    // Reset to original
    const resetData = useCallback(() => {
        setFds(MOCK_FDS);
        setLastAction('');
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--gold)]">
                    Test: FD Portfolio Component
                </h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                    Step 8 — Investment Portfolio Components
                </p>
            </div>

            {/* Controls */}
            <div className="mb-8 flex flex-wrap gap-3">
                <button
                    onClick={toggleLoading}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isLoading
                            ? 'bg-[var(--gold)] text-[var(--bg-primary)]'
                            : 'border border-[var(--bg-border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                        }`}
                >
                    {isLoading ? 'Stop Loading' : 'Simulate Loading'}
                </button>
                <button
                    onClick={toggleEmpty}
                    className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]"
                >
                    Toggle Empty State
                </button>
                <button
                    onClick={addLockedFD}
                    className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]"
                >
                    Add Locked FD (7 days)
                </button>
                <button
                    onClick={resetData}
                    className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]"
                >
                    Reset Data
                </button>
            </div>

            {/* Last Action */}
            {lastAction && (
                <div className="mb-6 rounded-lg border border-[var(--green)] bg-[var(--green)]/10 px-4 py-3 text-sm text-[var(--green)]">
                    {lastAction}
                </div>
            )}

            {/* FD Portfolio */}
            <FDPortfolio
                fds={fds}
                isLoading={isLoading}
                onBreakFD={handleBreakFD}
                isBreaking={isBreaking}
            />

            {/* Info Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Component Features
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Status badges (Active, Matured, Broken)</li>
                        <li>• Progress bar with tenure completion %</li>
                        <li>• Interest accrued display</li>
                        <li>• Break FD button with penalty modal</li>
                    </ul>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Test Scenarios
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Try breaking an Active FD</li>
                        <li>• Add locked FD to test 7-day lock</li>
                        <li>• Check loading skeleton animation</li>
                        <li>• View empty state CTA</li>
                    </ul>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Design Tokens
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Green (#22C55E) — Active, available</li>
                        <li>• Blue (#38BDF8) — Matured status</li>
                        <li>• Red (#EF4444) — Broken, danger</li>
                        <li>• Gold (#F5A623) — Accent, progress</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
