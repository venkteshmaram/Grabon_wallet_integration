// ============================================
// DIRECT WALLET PAYMENT API
// POST /api/wallet/pay-direct
// Handles 100% wallet/reward payments (no external PayU card needed)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processMerchantPayment } from '@/services/wallet';
import { generateTransactionId } from '@/services/payu/payu-hash';

const payDirectSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    amountPaisa: z.number().int().positive(),
    merchantId: z.string(),
    merchantName: z.string(),
    productInfo: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = payDirectSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }

        const { userId, amountPaisa, merchantId, merchantName, productInfo } = validation.data;
        const txnId = generateTransactionId();

        // Process the logic: spend balance + award cashback
        const result = await processMerchantPayment({
            userId,
            amountPaisa,
            merchantId,
            merchantName,
            description: productInfo || `Direct Wallet Payment - TXN: ${txnId}`,
            type: 'REWARD_SPEND',
        });

        return NextResponse.json({
            success: true,
            txnId,
            ledgerEntryId: result.ledgerEntry.id,
            message: 'Payment processed successfully using rewards',
        });
    } catch (error) {
        console.error('Direct wallet payment error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Payment failed' 
        }, { status: 500 });
    }
}
