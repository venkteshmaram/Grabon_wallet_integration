// ============================================
// MERCHANT DETAILS API ROUTE
// GET /api/merchants/:merchantId - Get specific merchant details
// ============================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET HANDLER - Get Merchant Details
// ============================================

export async function GET(
    request: Request,
    { params }: { params: { merchantId: string } }
): Promise<NextResponse> {
    try {
        const { merchantId } = params;

        if (!merchantId) {
            return NextResponse.json(
                { error: { message: 'Merchant ID is required', code: 'MISSING_MERCHANT_ID' } },
                { status: 400 }
            );
        }

        // Fetch merchant from database
        const merchant = await prisma.merchant.findUnique({
            where: { id: merchantId },
        });

        if (!merchant) {
            return NextResponse.json(
                { error: { message: 'Merchant not found', code: 'MERCHANT_NOT_FOUND' } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            data: merchant,
        }, { status: 200 });

    } catch (error) {
        console.error(`Get merchant ${params.merchantId} error:`, error);
        return NextResponse.json(
            { error: { message: 'Failed to fetch merchant details', code: 'FETCH_FAILED' } },
            { status: 500 }
        );
    }
}
