// ============================================
// TEST ANALYTICS PAGE
// Interactive demo and testing for analytics components
// ============================================

'use client';

import React, { useState, useCallback } from 'react';
import { DonutChart, BarChart, TopMerchants } from '@/components/features/analytics';
import type { CategoryData, MonthlyData, MerchantData } from '@/components/features/analytics';

// ============================================
// MOCK DATA
// ============================================

const MOCK_CATEGORY_DATA: CategoryData[] = [
    { category: 'Food & Dining', amount: 1250, percentage: 45 },
    { category: 'Shopping', amount: 600, percentage: 22 },
    { category: 'Travel', amount: 450, percentage: 16 },
    { category: 'Entertainment', amount: 300, percentage: 11 },
    { category: 'Other', amount: 166, percentage: 6 },
];

const MOCK_MONTHLY_DATA: MonthlyData[] = [
    { month: 'Oct', earned: 420, spent: 3500 },
    { month: 'Nov', earned: 380, spent: 2800 },
    { month: 'Dec', earned: 550, spent: 4200 },
    { month: 'Jan', earned: 290, spent: 2100 },
    { month: 'Feb', earned: 340, spent: 2600 },
    { month: 'Mar', earned: 476, spent: 3200 },
];

const MOCK_MERCHANTS: MerchantData[] = [
    { merchantName: 'Swiggy', category: 'Food & Dining', cashback: 425, transactionCount: 28 },
    { merchantName: 'Amazon', category: 'Shopping', cashback: 380, transactionCount: 12 },
    { merchantName: 'MakeMyTrip', category: 'Travel', cashback: 340, transactionCount: 3 },
    { merchantName: 'Zomato', category: 'Food & Dining', cashback: 285, transactionCount: 19 },
    { merchantName: 'BookMyShow', category: 'Entertainment', cashback: 165, transactionCount: 8 },
];

const ALT_CATEGORY_DATA: CategoryData[] = [
    { category: 'Groceries', amount: 850, percentage: 38 },
    { category: 'Electronics', amount: 500, percentage: 22 },
    { category: 'Bills', amount: 400, percentage: 18 },
    { category: 'Health', amount: 300, percentage: 13 },
    { category: 'Transport', amount: 200, percentage: 9 },
];

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function TestAnalyticsPage(): React.ReactElement {
    const [isLoading, setIsLoading] = useState(false);
    const [categoryData, setCategoryData] = useState<CategoryData[]>(MOCK_CATEGORY_DATA);
    const [merchantData, setMerchantData] = useState<MerchantData[]>(MOCK_MERCHANTS);
    const [showEmpty, setShowEmpty] = useState(false);

    const totalCashback = categoryData.reduce((sum, item) => sum + item.amount, 0);

    // Toggle loading state
    const toggleLoading = useCallback(() => {
        setIsLoading((prev) => !prev);
    }, []);

    // Toggle empty state
    const toggleEmpty = useCallback(() => {
        setShowEmpty((prev) => !prev);
    }, []);

    // Switch data
    const switchData = useCallback(() => {
        setCategoryData((prev) =>
            prev === MOCK_CATEGORY_DATA ? ALT_CATEGORY_DATA : MOCK_CATEGORY_DATA
        );
        setMerchantData((prev) =>
            prev === MOCK_MERCHANTS
                ? MOCK_MERCHANTS.slice(0, 3)
                : MOCK_MERCHANTS
        );
    }, []);

    // Data to display
    const displayCategories = showEmpty ? [] : categoryData;
    const displayMonthly = showEmpty ? [] : MOCK_MONTHLY_DATA;
    const displayMerchants = showEmpty ? [] : merchantData;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--gold)]">
                    Test: Analytics Components
                </h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                    Step 9 — Spend Analytics Components
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
                    onClick={switchData}
                    className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]"
                >
                    Swap Data
                </button>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {/* Donut Chart Card */}
                <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
                        Spending by Category
                    </h2>
                    <DonutChart
                        data={displayCategories}
                        totalCashback={showEmpty ? 0 : totalCashback}
                        isLoading={isLoading}
                    />
                </div>

                {/* Bar Chart Card */}
                <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
                        Monthly Trend
                    </h2>
                    <BarChart data={displayMonthly} isLoading={isLoading} />
                </div>

                {/* Top Merchants Card */}
                <div className="rounded-xl border border-[var(--bg-border)] bg-[var(--bg-card)] p-6 lg:col-span-2 xl:col-span-1">
                    <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
                        Top Merchants
                    </h2>
                    <TopMerchants merchants={displayMerchants} isLoading={isLoading} />
                </div>
            </div>

            {/* Info Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Donut Chart Features
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Category color coding (Gold, Green, Blue, Slate, Red)</li>
                        <li>• Center text showing total cashback</li>
                        <li>• Hover tooltip with details</li>
                        <li>• Legend with amounts and percentages</li>
                    </ul>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Bar Chart Features
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Monthly earned vs spent comparison</li>
                        <li>• Gold bars for earned, Charcoal for spent</li>
                        <li>• Y-axis with compact ₹ formatting</li>
                        <li>• Hover tooltip with exact amounts</li>
                    </ul>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)] p-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--gold)]">
                        Top Merchants Features
                    </h3>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <li>• Gold rank circles (1-5)</li>
                        <li>• Merchant name and category</li>
                        <li>• Green cashback amounts</li>
                        <li>• Transaction counts</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
