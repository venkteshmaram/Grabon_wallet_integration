// Minimal PayU test with only required fields
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Get config from env
        const key = process.env.PAYU_KEY || '';
        const salt = process.env.PAYU_SALT || '';
        const surl = process.env.PAYU_SUCCESS_URL || '';
        const furl = process.env.PAYU_FAILURE_URL || '';

        // Generate simple txnid (PayU prefers 20-25 chars alphanumeric)
        const txnid = 'TXN' + Date.now().toString(36).toUpperCase();

        // Simple amount
        const amount = '1.00';

        // Test user data (in real scenario, these come from your DB)
        const userId = 'ad48ead0-abd0-49f2-84db-bb0a94d7ec15'; // Priya Sharma's ID from test
        const merchantId = 'test_merchant_001';
        const merchantName = 'Test Store';

        // Build hash string - WITH UDF fields for our system to work
        const hashString = [
            key,
            txnid,
            amount,
            'Test Product',
            'Test',
            'test@test.com',
            userId, // udf1 - required for our system
            merchantId, // udf2 - required for our system
            merchantName, // udf3 - required for our system
            '', // udf4
            '', // udf5
            '', '', '', '', '', // 5 empty
            salt
        ].join('|');

        const hash = createHash('sha512').update(hashString).digest('hex');

        // Form params with UDF fields
        const formParams: Record<string, string> = {
            key,
            txnid,
            amount,
            productinfo: 'Test Product',
            firstname: 'Test',
            email: 'test@test.com',
            phone: '9999999999',
            udf1: userId,
            udf2: merchantId,
            udf3: merchantName,
            udf4: '',
            udf5: '',
            surl,
            furl,
            hash,
        };

        // Build HTML form
        const inputs = Object.entries(formParams)
            .map(([k, v]) => `        <input type="hidden" name="${k}" value="${v}" />`)
            .join('\n');

        const html = `<!DOCTYPE html>
<html>
<head>
    <title>PayU Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .info { background: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .debug { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; font-family: monospace; font-size: 12px; }
        button { padding: 15px 30px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>PayU Test (₹1.00)</h1>
    
    <div class="info">
        <strong>Test Card:</strong> 5123456789012346 | 05/25 | 123 | OTP: 123456
    </div>

    <form action="https://test.payu.in/_payment" method="POST">
${inputs}
        <button type="submit">Pay ₹1.00</button>
    </form>

    <div class="debug">
        <strong>Hash:</strong> ${hash.substring(0, 32)}...<br>
        <strong>Txn ID:</strong> ${txnid}
    </div>
</body>
</html>`;

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
