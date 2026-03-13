// ============================================
// TEST PAGE - Balance Card Component
// Step 5: How to Test for Beginners
// ============================================

'use client';

import { useState } from 'react';
import { BalanceCard } from '@/components/features/wallet';
import { useWallet } from '@/hooks';
import { useAuthStore } from '@/store/auth-store';

/**
 * This is a TEST PAGE to see the Balance Card component.
 * 
 * HOW TO VIEW:
 * 1. Make sure the dev server is running (npm run dev)
 * 2. Open your browser to: http://localhost:3001/test-balance-card
 * 3. You should see the Balance Card with your wallet data!
 */

export default function TestBalanceCardPage() {
    // Get the logged-in user's ID from auth store
    const userId = useAuthStore((state) => state.userId);

    // Fetch wallet data using our custom hook from Step 4
    const { wallet, isLoading, error, refetch } = useWallet(userId ?? undefined);

    // State to toggle between different test scenarios
    const [testScenario, setTestScenario] = useState<'normal' | 'loading' | 'error'>('normal');

    // If no user is logged in, show login message
    if (!userId) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-primary)',
                minHeight: '100vh',
                color: 'var(--text-primary)'
            }}>
                <h1>Please Login First</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Go to <a href="/login" style={{ color: 'var(--gold)' }}>/login</a> and sign in,
                    then come back to this page.
                </p>
            </div>
        );
    }

    return (
        <div style={{
            padding: '40px',
            backgroundColor: 'var(--bg-primary)',
            minHeight: '100vh'
        }}>
            <h1 style={{
                color: 'var(--text-primary)',
                marginBottom: '24px',
                fontSize: '24px'
            }}>
                🧪 Testing Balance Card Component
            </h1>

            {/* Test Scenario Buttons */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <button
                    onClick={() => setTestScenario('normal')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: testScenario === 'normal' ? 'var(--gold)' : 'var(--bg-card)',
                        color: testScenario === 'normal' ? '#1A1A1A' : 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    Normal State
                </button>
                <button
                    onClick={() => setTestScenario('loading')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: testScenario === 'loading' ? 'var(--gold)' : 'var(--bg-card)',
                        color: testScenario === 'loading' ? '#1A1A1A' : 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    Loading State
                </button>
                <button
                    onClick={() => setTestScenario('error')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: testScenario === 'error' ? 'var(--gold)' : 'var(--bg-card)',
                        color: testScenario === 'error' ? '#1A1A1A' : 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    Error State
                </button>
            </div>

            {/* Balance Card Component */}
            <div style={{ maxWidth: '600px' }}>
                <BalanceCard
                    wallet={testScenario === 'normal' ? wallet : null}
                    accountAge="6 months"
                    isLoading={testScenario === 'loading' || (testScenario === 'normal' && isLoading)}
                    error={testScenario === 'error' ? 'Failed to load wallet balance. Click Retry to try again.' : error}
                    onRetry={refetch}
                    earliestUnlockDate="15 Mar 2025"
                />
            </div>

            {/* Instructions */}
            <div style={{
                marginTop: '40px',
                padding: '20px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                maxWidth: '600px'
            }}>
                <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>
                    📖 What You're Seeing
                </h2>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li><strong>Normal State:</strong> Shows your actual wallet balance with all three stats</li>
                    <li><strong>Loading State:</strong> Shows the gold shimmer skeleton animation</li>
                    <li><strong>Error State:</strong> Shows red error banner with retry button</li>
                </ul>

                <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>
                    🎯 Try These Actions:
                </h3>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li>Hover over "Pending", "Locked", "Lifetime Earned" to see tooltips</li>
                    <li>Click "Pay with GrabCash" → goes to /checkout</li>
                    <li>Click "Invest in GrabSave" → goes to /wallet/invest</li>
                    <li>Click "View History" → goes to /wallet/transactions</li>
                    <li>In Error state, click "Retry" button</li>
                </ul>
            </div>
        </div>
    );
}
