// Debug endpoint to verify PayU hash generation
import { NextRequest, NextResponse } from 'next/server';
import { buildPayUFormParams, generatePayUHash } from '@/services/payu';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Test data
        const testTxnId = 'TEST_TXN_' + Date.now();
        const testAmountPaisa = 50000; // ₹500.00
        const testProductInfo = 'Test Product';
        const testEmail = 'test@example.com';
        const testName = 'Test User';
        const testUserId = 'user_123';
        const testMerchantId = 'merchant_456';
        const testMerchantName = 'Test Merchant';

        // Build form params
        const formParams = buildPayUFormParams(
            testUserId,
            testAmountPaisa,
            testTxnId,
            testProductInfo,
            testEmail,
            testName,
            testMerchantId,
            testMerchantName,
            '9999999999'
        );

        // Show hash calculation details
        const amountRupees = (testAmountPaisa / 100).toFixed(2);
        const hashStringParts = [
            formParams.key,
            testTxnId,
            amountRupees,
            testProductInfo,
            testName,
            testEmail,
            testUserId, // udf1
            testMerchantId, // udf2
            testMerchantName, // udf3
            '', // udf4
            '', // udf5
            '', '', '', '', '', // 5 empty fields
            'SALT_HIDDEN'
        ];

        return NextResponse.json({
            success: true,
            debug: {
                hashStringFormat: 'key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt',
                hashStringParts: hashStringParts,
                formParams: {
                    ...formParams,
                    hash: formParams.hash.substring(0, 20) + '...',
                },
                notes: [
                    'The hash is generated from pipe-separated values',
                    'Amount must be in rupees with 2 decimal places',
                    'UDF fields are included in the hash',
                    '5 empty fields (||||||) are between udf5 and salt'
                ]
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
