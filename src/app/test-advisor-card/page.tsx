// ============================================
// TEST PAGE - Advisor Card Component
// Step 6: How to Test for Beginners
// ============================================

'use client';

import { useState } from 'react';
import { AdvisorCard } from '@/components/features/advisor';
import { useAdvisor } from '@/hooks';
import { useAuthStore } from '@/store/auth-store';

/**
 * This is a TEST PAGE to see the Advisor Card component.
 * 
 * HOW TO VIEW:
 * 1. Make sure the dev server is running (npm run dev)
 * 2. Open your browser to: http://localhost:3001/test-advisor-card
 * 3. You should see the Advisor Card with AI recommendations!
 */

export default function TestAdvisorCardPage() {
    // Get the logged-in user's ID from auth store
    const userId = useAuthStore((state) => state.userId);

    // Fetch advisor data using our custom hook from Step 4
    const { advisor, isLoading, isRefreshing, error, refresh } = useAdvisor(userId ?? undefined);

    // State to toggle between different test scenarios
    const [testScenario, setTestScenario] = useState<'normal' | 'loading' | 'error' | 'empty'>('normal');

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

    // Mock advisor data for testing
    const mockAdvisor = {
        id: 'advisor-1',
        summary: 'Based on your spending pattern at Amazon (₹3,400) and Zepto (₹800), you have earned ₹340 cashback this week. Your dining expenses at Zomato have increased by 20%.',
        recommendation: 'Consider investing your ₹2,500 available balance in a 90-day GrabSave FD at 7.5% p.a. to earn ₹46 in interest.',
        actionItems: [
            'Invest ₹2,500 in GrabSave FD for 90 days',
            'Review your dining budget - 20% increase detected',
            'Your cashback will settle in 24 hours',
        ],
        alert: 'Your cashback settlement of ₹340 is pending and will be available tomorrow.',
        generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    };

    const displayAdvisor = testScenario === 'normal'
        ? (advisor || mockAdvisor)
        : (testScenario === 'empty' ? null : advisor);

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
                Testing Advisor Card Component
            </h1>

            {/* Test Scenario Buttons */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                <button
                    onClick={() => setTestScenario('empty')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: testScenario === 'empty' ? 'var(--gold)' : 'var(--bg-card)',
                        color: testScenario === 'empty' ? '#1A1A1A' : 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    Empty State (New User)
                </button>
            </div>

            {/* Advisor Card Component */}
            <div style={{ maxWidth: '600px' }}>
                <AdvisorCard
                    advisor={displayAdvisor}
                    isLoading={testScenario === 'loading' || (testScenario === 'normal' && isLoading)}
                    isRefreshing={testScenario === 'normal' && isRefreshing}
                    error={testScenario === 'error' ? 'Failed to load advisor recommendation from the server.' : error}
                    onRefresh={refresh}
                    onRetry={() => window.location.reload()}
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
                    What You are Seeing
                </h2>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li><strong>Normal State:</strong> Shows AI advisor with summary, recommendation, and action items</li>
                    <li><strong>Loading State:</strong> Shows gold shimmer skeleton while analysis generates</li>
                    <li><strong>Error State:</strong> Shows red error banner with retry button</li>
                    <li><strong>Empty State:</strong> Shows Generating your personalised analysis for new users</li>
                </ul>

                <h3 style={{ color: 'var(--text-primary)', marginTop: '20px', marginBottom: '8px' }}>
                    Try These Actions:
                </h3>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li>Look for rupee amounts highlighted in gold in the summary text</li>
                    <li>Click the invest action button (gold button) to navigate to invest page</li>
                    <li>Click Refresh Analysis to trigger a new AI analysis</li>
                    <li>Notice the Last updated timestamp showing relative time</li>
                    <li>The Alert section shows important notifications in amber</li>
                </ul>
            </div>
        </div>
    );
}
