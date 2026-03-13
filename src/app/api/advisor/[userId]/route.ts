// ============================================
// ADVISOR API ROUTE
// GET /api/advisor/:userId - Get latest recommendation
// ============================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET HANDLER - Get Latest Recommendation
// ============================================

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        const { userId } = params;

        if (!userId) {
            return NextResponse.json(
                { error: { message: 'User ID is required', code: 'MISSING_USER_ID' } },
                { status: 400 }
            );
        }

        // Fetch the latest advisor recommendation from database
        const advisor = await prisma.advisorRecommendation.findFirst({
            where: { userId },
            orderBy: { generatedAt: 'desc' },
        });

        // If no advisor record exists, auto-generate one
        if (!advisor) {
            console.log(`No advisor record for user ${userId}, generating initial advice...`);
            const { generateAdvice } = await import('@/services/advisor/claude-advisor');
            const advice = await generateAdvice(userId);

            // Save to database
            const created = await prisma.advisorRecommendation.create({
                data: {
                    userId,
                    summary: advice.summary,
                    recommendation: advice.recommendation,
                    actionItems: JSON.stringify(advice.actionItems),
                    alert: advice.alert,
                    contextUsed: advice.contextUsed,
                    generatedAt: new Date(),
                },
            });

            return NextResponse.json({
                data: {
                    id: created.id,
                    summary: created.summary,
                    recommendation: created.recommendation,
                    actionItems: advice.actionItems, // Use the array from generateAdvice
                    alert: created.alert,
                    generatedAt: created.generatedAt.toISOString(),
                },
            }, { status: 200 });
        }

        // Parse actionItems from JSON string to array
        let actionItems: string[] = [];
        try {
            if (advisor.actionItems) {
                const parsed = JSON.parse(advisor.actionItems as string);
                if (Array.isArray(parsed)) {
                    actionItems = parsed;
                }
            }
        } catch {
            // If parsing fails, use empty array
            actionItems = [];
        }

        return NextResponse.json({
            data: {
                id: advisor.id,
                summary: advisor.summary,
                recommendation: advisor.recommendation,
                actionItems,
                alert: advisor.alert,
                generatedAt: advisor.generatedAt.toISOString(),
            },
        }, { status: 200 });

    } catch (error) {
        console.error('Get advisor recommendation error:', error);
        return NextResponse.json(
            { error: { message: 'Failed to fetch recommendation', code: 'FETCH_FAILED' } },
            { status: 500 }
        );
    }
}
