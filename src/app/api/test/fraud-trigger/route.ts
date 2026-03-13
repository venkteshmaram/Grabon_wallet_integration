import { NextResponse } from 'next/server';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';
import { creditCashback, settlePendingEntry } from '@/services/wallet/wallet-service';

/**
 * SECRET TEST ENDPOINT
 * POST /api/test/fraud-trigger
 * 
 * Credits ₹100 and settles it instantly.
 * This starts the 90-second clock for a manual fraud velocity test.
 */
async function postHandler(request: AuthenticatedRequest): Promise<NextResponse> {
    try {
        const userId = extractUserId(request);
        
        // 1. Credit ₹100 (10,000 paisa)
        const credit = await creditCashback({
            userId,
            amountPaisa: 10000,
            merchantName: 'Zomato (System Test)',
            category: 'Food',
            description: 'Test credit for fraud velocity check',
        });
        
        // 2. Settle it immediately
        await settlePendingEntry(credit.id);
        
        return NextResponse.json({
            success: true,
            message: 'Cashback ₹100 credited and settled! You have 90 SECONDS to attempt a merchant payment to trigger the OTP.',
            timestamp: new Date().toISOString(),
            userId
        });
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}

export const POST = withAuth(postHandler);
