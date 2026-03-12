// ============================================
// ADVISOR API ROUTE
// GET /api/advisor/:userId - Get latest recommendation
// ============================================

import { NextResponse } from 'next/server';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';

// ============================================
// ERROR RESPONSE HELPER
// ============================================

function createErrorResponse(message: string, code: string, status: number = 400) {
    return NextResponse.json(
        {
            error: {
                message,
                code,
            },
        },
        { status }
    );
}

// ============================================
// GET HANDLER - Get Latest Recommendation
// ============================================

async function getHandler(
    request: AuthenticatedRequest,
    { params }: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        // Get authenticated user ID
        const authUserId = extractUserId(request);
        const { userId } = params;

        // Verify user is accessing their own advisor
        if (authUserId !== userId) {
            return createErrorResponse(
                'You can only access your own advisor recommendations',
                'FORBIDDEN',
                403
            );
        }

        // Phase 2: Stub - return sample recommendation
        // Phase 3: Will fetch from database after Claude integration
        const stubRecommendation = {
            summary: 'Phase 2 stub - Claude advisor integration pending',
            recommendation: 'Invest ₹X in GrabSave FD and keep ₹Y liquid',
            actionItems: [
                { action: 'Create FD', amount: 100000, label: '₹1,000' },
                { action: 'Keep liquid', amount: 50000, label: '₹500' },
            ],
            alert: null,
            generatedAt: new Date().toISOString(),
            isStub: true,
        };

        return NextResponse.json(
            {
                data: {
                    recommendation: stubRecommendation,
                    note: 'Phase 2 stub - full Claude integration in Phase 3',
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get advisor recommendation error:', error);
        return createErrorResponse(
            'Failed to fetch recommendation',
            'FETCH_FAILED',
            500
        );
    }
}

// Export wrapped with auth middleware
export const GET = withAuth(getHandler);
