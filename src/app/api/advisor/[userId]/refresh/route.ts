// ============================================
// ADVISOR REFRESH API ROUTE - CLAUDE AI INTEGRATION
// POST /api/advisor/[userId]/refresh
// Triggers a new AI analysis using Claude AI for the user
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAdvice } from '@/services/advisor/claude-advisor';

// ============================================
// POST HANDLER
// ============================================

/**
 * POST /api/advisor/[userId]/refresh
 * 
 * Triggers a fresh AI analysis using Claude AI for the user's financial data.
 * Builds comprehensive context from wallet, FDs, transactions, and analytics,
 * generates personalized recommendations, and stores the result in the database.
 */
export async function POST(
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

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: { message: 'User not found', code: 'USER_NOT_FOUND' } },
                { status: 404 }
            );
        }

        // Generate AI recommendation using Claude
        const advice = await generateAdvice(userId);

        // Save to database for persistence
        const existingAdvisor = await prisma.advisorRecommendation.findFirst({
            where: { userId },
        });

        let advisorData;
        if (existingAdvisor) {
            advisorData = await prisma.advisorRecommendation.update({
                where: { id: existingAdvisor.id },
                data: {
                    summary: advice.summary,
                    recommendation: advice.recommendation,
                    actionItems: JSON.stringify(advice.actionItems),
                    alert: advice.alert,
                    contextUsed: advice.contextUsed,
                    generatedAt: new Date(),
                },
            });
        } else {
            advisorData = await prisma.advisorRecommendation.create({
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
        }

        // Return the AI-generated recommendation
        return NextResponse.json({
            data: {
                id: advisorData.id,
                summary: advisorData.summary,
                recommendation: advisorData.recommendation,
                actionItems: advice.actionItems,
                alert: advisorData.alert,
                generatedAt: advisorData.generatedAt.toISOString(),
            },
        });

    } catch (error) {
        console.error('Advisor refresh error:', error);

        return NextResponse.json(
            { error: { message: 'Failed to generate advisor recommendation', code: 'ADVISOR_ERROR' } },
            { status: 500 }
        );
    }
}
