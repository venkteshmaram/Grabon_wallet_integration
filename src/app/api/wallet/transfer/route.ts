import { NextRequest, NextResponse } from 'next/server';
import { spendBalance } from '@/services/wallet/wallet-service';
import { withAuth, extractUserId, AuthenticatedRequest } from '@/middleware/auth';

/**
 * Handle POST /api/wallet/transfer
 */
async function postHandler(request: AuthenticatedRequest) {
    try {
        const userId = extractUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amountPaisa, accountDetails } = await request.json();

        if (!amountPaisa) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Use spendBalance to deduct funds
        const result = await spendBalance({
            userId,
            amountPaisa,
            merchantId: 'BANK_TRANSFER',
            merchantName: accountDetails?.bankName || 'Linked Bank Account',
            description: `Transfer to Bank: ${accountDetails?.accountNumber || 'Primary Account'}`
        });

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Transfer Error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Transfer failed' 
        }, { status: 500 });
    }
}

export const POST = withAuth(postHandler);
