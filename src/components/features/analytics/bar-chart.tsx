// ============================================
// BAR CHART COMPONENT - Monthly Trend
// Step 9: Spend Analytics Components
// ============================================

'use client';

import React, { useMemo } from 'react';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from 'recharts';

// ============================================
// TYPES
// ============================================

interface MonthlyData {
    month: string;
    amountRupees: number;
    spentRupees: number;
}

interface BarChartProps {
    /** Monthly trend data */
    data: MonthlyData[];
    /** Loading state */
    isLoading: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const COLORS = {
    earned: '#F5A623', // Gold
    spent: '#3A3A3A', // Charcoal
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format amount in rupees (compact for Y-axis)
 */
function formatRupeesCompact(value: number): string {
    if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)}k`;
    }
    return `₹${value}`;
}

/**
 * Format full amount in rupees
 */
function formatRupees(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// ============================================
// LOADING SKELETON COMPONENT
// ============================================

function BarChartSkeleton(): React.ReactElement {
    return (
        <div className="flex h-[250px] items-end justify-between gap-4 px-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                        className="animate-shimmer w-full rounded-t bg-[var(--bg-border)]"
                        style={{ height: `${20 + Math.random() * 60}%` }}
                    />
                    <div className="h-3 w-8 rounded bg-[var(--bg-border)]" />
                </div>
            ))}
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
        dataKey: string;
    }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps): React.ReactElement | null {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-card)] p-3 shadow-lg">
                <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                    {label}
                </p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-2 w-2 rounded-sm"
                                    style={{
                                        backgroundColor:
                                            entry.dataKey === 'earned'
                                                ? COLORS.earned
                                                : COLORS.spent,
                                    }}
                                />
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {entry.name}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                {formatRupees(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}

// ============================================
// MAIN BAR CHART COMPONENT
// ============================================

export function BarChart({ data, isLoading }: BarChartProps): React.ReactElement {
    // Prepare chart data with full month names for display
    const chartData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            displayMonth: item.month,
            earned: item.amountRupees,
            spent: item.spentRupees,
        }));
    }, [data]);

    // Loading state
    if (isLoading) {
        return <BarChartSkeleton />;
    }

    // Empty state
    if (data.length === 0) {
        return (
            <div className="flex h-[250px] flex-col items-center justify-center">
                <p className="text-[var(--text-secondary)]">No monthly data yet</p>
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RechartsBarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    barGap={4}
                >
                    {/* Grid */}
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#2E2E2E"
                        vertical={false}
                    />

                    {/* X Axis */}
                    <XAxis
                        dataKey="displayMonth"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: '#A0A0A0',
                            fontSize: 12,
                        }}
                        dy={10}
                    />

                    {/* Y Axis */}
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: '#A0A0A0',
                            fontSize: 11,
                        }}
                        tickFormatter={formatRupeesCompact}
                        dx={-5}
                    />

                    {/* Tooltip */}
                    <RechartsTooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(245, 166, 35, 0.05)' }}
                    />

                    {/* Earned Bar */}
                    <Bar
                        dataKey="earned"
                        name="Earned"
                        fill={COLORS.earned}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />

                    {/* Spent Bar */}
                    <Bar
                        dataKey="spent"
                        name="Spent"
                        fill={COLORS.spent}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                </RechartsBarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                    <span
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: COLORS.earned }}
                    />
                    <span className="text-xs text-[var(--text-secondary)]">
                        Cashback Earned
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: COLORS.spent }}
                    />
                    <span className="text-xs text-[var(--text-secondary)]">
                        Amount Spent
                    </span>
                </div>
            </div>
        </div>
    );
}

// Export types
export type { BarChartProps, MonthlyData };
