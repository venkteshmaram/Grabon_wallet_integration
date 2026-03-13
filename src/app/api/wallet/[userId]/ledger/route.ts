// ============================================
// LEDGER API ROUTE
// GET /api/wallet/:userId/ledger - Get transaction history
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET HANDLER
// ============================================

/**
 * GET /api/wallet/:userId/ledger
 * 
 * Fetches paginated ledger entries for a user with optional filtering.
 * Supports query parameters:
 * - type: Filter by transaction type
 * - startDate: Filter from date (ISO string)
 * - endDate: Filter to date (ISO string)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        const { userId } = params;

        // Validate userId
        if (!userId) {
            return NextResponse.json(
                { error: { message: 'User ID is required', code: 'MISSING_USER_ID' } },
                { status: 400 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const isFlagged = searchParams.get('isFlagged');
        const merchantId = searchParams.get('merchantId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

        // Build where clause
        const where: {
            userId: string;
            type?: { in: string[] };
            isFlagged?: boolean;
            merchantId?: string;
            createdAt?: { gte?: Date; lte?: Date };
        } = { userId };

        // Add type filter if provided
        if (type) {
            where.type = { in: type.split(',') };
        }

        // Add isFlagged filter if provided
        if (isFlagged !== null && isFlagged !== undefined) {
            where.isFlagged = isFlagged === 'true';
        }

        if (merchantId) {
            where.merchantId = merchantId;
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Fetch total count for pagination
        const totalCount = await prisma.ledgerEntry.count({ where });

        // Fetch ledger entries
        const entries = await prisma.ledgerEntry.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            data: {
                entries: entries.map((entry: {
                    id: string;
                    type: string;
                    direction: string;
                    amount: number;
                    balanceAfter: number;
                    status: string;
                    merchantId: string | null;
                    merchantName: string | null;
                    category: string | null;
                    description: string | null;
                    fdId: string | null;
                    isFlagged: boolean;
                    flagReason: string | null;
                    createdAt: Date;
                    settledAt: Date | null;
                }) => ({
                    id: entry.id,
                    type: entry.type,
                    direction: entry.direction,
                    amount: entry.amount,
                    balanceAfter: entry.balanceAfter,
                    status: entry.status,
                    merchantId: entry.merchantId,
                    merchantName: entry.merchantName,
                    category: entry.category,
                    description: entry.description,
                    fdId: entry.fdId,
                    isFlagged: entry.isFlagged,
                    flagReason: entry.flagReason,
                    createdAt: entry.createdAt.toISOString(),
                    settledAt: entry.settledAt?.toISOString() || null,
                })),
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages,
                    hasMore: page < totalPages,
                },
            },
        }, { status: 200 });

    } catch (error) {
        console.error('Get ledger error:', error);

        return NextResponse.json(
            { error: { message: 'Failed to fetch ledger entries', code: 'LEDGER_ERROR' } },
            { status: 500 }
        );
    }
}
