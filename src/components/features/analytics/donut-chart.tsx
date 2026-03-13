// ============================================
// DONUT CHART COMPONENT - Category Breakdown
// Step 9: Spend Analytics Components
// ============================================

'use client';

import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from 'recharts';

// ============================================
// TYPES
// ============================================

interface CategoryData {
    category: string;
    amountRupees: number;
    percentage: number;
}

interface DonutChartProps {
    /** Category breakdown data */
    data: CategoryData[];
    /** Total cashback earned */
    totalCashback: number;
    /** Loading state */
    isLoading: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const CATEGORY_COLORS: Record<string, string> = {
    'Food & Dining': '#F5A623', // Gold
    'Shopping': '#22C55E', // Green
    'Travel': '#38BDF8', // Blue
    'Entertainment': '#94A3B8', // Slate
    'Other': '#EF4444', // Red
    'Groceries': '#F5A623',
    'Electronics': '#22C55E',
    'Bills': '#38BDF8',
    'Health': '#94A3B8',
    'Transport': '#EF4444',
};

const DEFAULT_COLOR = '#94A3B8'; // Slate for unknown categories

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
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Get color for category
 */
function getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

// ============================================
// LOADING SKELETON COMPONENT
// ============================================

function DonutChartSkeleton(): React.ReactElement {
    return (
        <div className="flex flex-col items-center">
            {/* Chart Placeholder */}
            <div className="relative mb-4 h-[200px] w-[200px]">
                <div className="absolute inset-0 animate-shimmer rounded-full bg-[var(--bg-border)]" />
                <div className="absolute inset-[30%] rounded-full bg-[var(--bg-primary)]" />
            </div>
            {/* Legend Placeholders */}
            <div className="w-full space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="animate-shimmer h-4 w-full rounded bg-[var(--bg-border)]"
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================
// CUSTOM TOOLTIP COMPONENT
// ============================================

interface TooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        payload: CategoryData;
    }>;
}

function CustomTooltip({ active, payload }: TooltipProps): React.ReactElement | null {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-card)] p-3 shadow-lg">
                <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
                    {data.category}
                </p>
                <p className="text-lg font-bold text-[var(--gold)]">
                    {formatRupees(data.amountRupees)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                    {data.percentage}% of total
                </p>
            </div>
        );
    }
    return null;
}

// ============================================
// MAIN DONUT CHART COMPONENT
// ============================================

export function DonutChart({
    data,
    totalCashback,
    isLoading,
}: DonutChartProps): React.ReactElement {
    // Prepare chart data
    const chartData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            fill: getCategoryColor(item.category),
        }));
    }, [data]);

    // Loading state
    if (isLoading) {
        return <DonutChartSkeleton />;
    }

    // Empty state
    if (data.length === 0) {
        return (
            <div className="flex h-[300px] flex-col items-center justify-center">
                <p className="text-[var(--text-secondary)]">No spending data yet</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            {/* Chart Container */}
            <div className="relative h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="amountRupees"
                            nameKey="category"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-[var(--text-secondary)]">Total</span>
                    <span className="text-xl font-bold text-[var(--gold)]">
                        {formatRupees(totalCashback)}
                    </span>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 w-full space-y-2">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between text-xs"
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: getCategoryColor(item.category) }}
                            />
                            <span className="text-[var(--text-secondary)]">
                                {item.category}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--text-primary)]">
                                {formatRupees(item.amountRupees)}
                            </span>
                            <span className="w-10 text-right text-[var(--text-secondary)]">
                                {item.percentage}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Export types
export type { DonutChartProps, CategoryData };
