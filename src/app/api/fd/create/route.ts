import { NextRequest, NextResponse } from 'next/server';
import { createFD, getUserFDs } from '@/services/fd';

// POST /api/fd/create
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[API_FD_CREATE] Request body:', body);
        const { userId, principalPaisa, tenureDays } = body;

        // Create the FD
        const fd = await createFD({
            userId,
            principalPaisa,
            tenureDays,
        });

        console.log('[API_FD_CREATE] Success:', fd.id);
        return NextResponse.json({
            success: true,
            data: fd,
        });
    } catch (error) {
        console.error('[API_FD_CREATE] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                code: (error as { code?: string }).code,
            },
            { status: 400 }
        );
    }
}

// GET /api/fd/create (for testing - shows user's FDs)
export async function GET() {
    try {
        // For testing, get the first user
        const { prisma } = await import('@/lib/prisma');
        const user = await prisma.user.findFirst();

        if (!user) {
            return NextResponse.json({ error: 'No user found' }, { status: 404 });
        }

        const portfolio = await getUserFDs(user.id);

        return NextResponse.json({
            success: true,
            user: user.name,
            portfolio: {
                totalFDs: portfolio.fds.length,
                totalActiveFDs: portfolio.totalActiveFDs,
                totalPortfolioValue: `₹${portfolio.totalPortfolioValueRupees}`,
                totalLocked: `₹${portfolio.totalLockedRupees}`,
                fds: portfolio.fds.map((fd) => ({
                    id: fd.id.substring(0, 8) + '...',
                    principal: `₹${fd.principalRupees}`,
                    maturityAmount: `₹${fd.maturityAmountRupees}`,
                    status: fd.status,
                    progress: `${fd.progressPercentage.toFixed(1)}%`,
                })),
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
