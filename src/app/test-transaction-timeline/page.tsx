// ============================================
// TEST PAGE - Transaction Timeline Component
// Step 7: How to Test for Beginners
// ============================================

'use client';

import { useState } from 'react';
import { TransactionTimeline } from '@/components/features/wallet';
import { useTransactions } from '@/hooks';
import { useAuthStore } from '@/store/auth-store';
import type { TransactionFilter } from '@/components/features/wallet/transaction-timeline';

/**
 * This is a TEST PAGE to see the Transaction Timeline component.
 * 
 * HOW TO VIEW:
 * 1. Make sure the dev server is running (npm run dev)
 * 2. Open your browser to: http://localhost:3001/test-transaction-timeline
 * 3. You should see the Transaction Timeline with filters!
 */

export default function TestTransactionTimelinePage() {
    // Get the logged-in user's ID from auth store
    const userId = useAuthStore((state) => state.userId);

    // State for filter
    const [filter, setFilter] = useState<TransactionFilter>('ALL');
    const [isTestLoading, setIsTestLoading] = useState(false);

    // Fetch transactions using our custom hook from Step 4
    const { transactions, isLoading, error, refetch } = useTransactions({
        userId: userId ?? undefined,
        filter,
        page: 1,
        pageSize: 20,
    });

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

    // Show error if fetch failed
    if (error) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-primary)',
                minHeight: '100vh',
                color: 'var(--text-primary)'
            }}>
                <h1>Error Loading Transactions</h1>
                <p style={{ color: 'var(--red)' }}>{error}</p>
                <button
                    onClick={refetch}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        backgroundColor: 'var(--gold)',
                        color: '#1A1A1A',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
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
                Testing Transaction Timeline Component
            </h1>

            {/* Test Controls */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setIsTestLoading(!isTestLoading)}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: isTestLoading ? 'var(--gold)' : 'var(--bg-card)',
                        color: isTestLoading ? '#1A1A1A' : 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    {isTestLoading ? 'Stop Loading' : 'Test Loading State'}
                </button>
                <button
                    onClick={refetch}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    Refresh Data
                </button>
            </div>

            {/* Transaction Timeline Component */}
            <div style={{ maxWidth: '700px' }}>
                <TransactionTimeline
                    transactions={transactions}
                    isLoading={isLoading || isTestLoading}
                    filter={filter}
                    onFilterChange={setFilter}
                    maxItems={10}
                    showViewAll={transactions.length > 10}
                    onViewAll={() => window.location.href = '/wallet/transactions'}
                />
            </div>

            {/* Instructions */}
            <div style={{
                marginTop: '40px',
                padding: '20px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                maxWidth: '700px'
            }}>
                <h2 style={{ color: 'var(--gold)', marginBottom: '12px' }}>
                    What You are Seeing
                </h2>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li><strong>Filter Tabs:</strong> All | Credits | Spends | FD | Flagged</li>
                    <li><strong>Green Icon:</strong> Credits (cashback earned)</li>
                    <li><strong>Red Icon:</strong> Debits (spends)</li>
                    <li><strong>Blue Icon:</strong> FD operations</li>
                    <li><strong>Orange Icon:</strong> Flagged transactions</li>
                </ul>

                <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>
                    Try These Actions:
                </h3>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li>Click different <strong>filter tabs</strong> to see filtered transactions</li>
                    <li>Look for <strong>status badges</strong>: Pending (slate), Settled (green), On Hold (orange), Failed (red)</li>
                    <li>Pending transactions have a <strong>pulsing animation</strong></li>
                    <li>Flagged transactions show an <strong>orange left border</strong> and flag reason</li>
                    <li>Click <strong>Test Loading State</strong> to see the skeleton animation</li>
                    <li>Click <strong>View All Transactions</strong> to navigate to full history</li>
                </ul>
            </div>
        </div>
    );
}
