// Test endpoint that returns an HTML form for manual PayU testing
import { NextRequest, NextResponse } from 'next/server';
import { buildPayUFormParams } from '@/services/payu';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Generate test params
        const txnId = 'TEST_' + Date.now();
        const formParams = buildPayUFormParams(
            'test_user_123',
            10000, // ₹100.00
            txnId,
            'Test Product',
            'test@example.com',
            'Test User',
            'test_merchant_456',
            'Test Merchant',
            '9999999999'
        );

        // Build HTML form
        const inputs = Object.entries(formParams)
            .map(([key, value]) => `        <input type="hidden" name="${key}" value="${value}" />`)
            .join('\n');

        const html = `<!DOCTYPE html>
<html>
<head>
    <title>PayU Test Form</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .debug { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; overflow-x: auto; }
        pre { margin: 0; font-size: 12px; }
        button { padding: 15px 30px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px; }
        button:hover { background: #0056b3; }
        .info { background: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <h1>PayU Test Payment Form</h1>
    
    <div class="info">
        <strong>Test Card Details:</strong><br>
        Card Number: 5123456789012346<br>
        Expiry: 05/25<br>
        CVV: 123<br>
        OTP: 123456
    </div>

    <form action="https://test.payu.in/_payment" method="POST">
${inputs}
        <button type="submit">Pay ₹100.00 Test Payment</button>
    </form>

    <div class="debug">
        <h3>Debug Info:</h3>
        <pre>${JSON.stringify({
            ...formParams,
            hash: formParams.hash.substring(0, 30) + '...'
        }, null, 2)}</pre>
    </div>

    <script>
        // Auto-submit for testing (remove this line to manually click)
        // document.querySelector('form').submit();
    </script>
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
