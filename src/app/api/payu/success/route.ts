import { NextRequest, NextResponse } from 'next/server';
import { processPayUWebhook } from '@/services/payu';

// Get base URL from env or request - required for ngrok compatibility
function getBaseUrl(request: NextRequest): string {
    // Try to extract base from PAYU_SUCCESS_URL env var (most reliable with ngrok)
    const successUrl = process.env.PAYU_SUCCESS_URL;
    if (successUrl) {
        try {
            const url = new URL(successUrl);
            return `${url.protocol}//${url.host}`;
        } catch {
            // fall through
        }
    }
    // Fallback to request URL
    return new URL(request.url).origin;
}

function toRecordFromSearchParams(searchParams: URLSearchParams): Record<string, string> {
    const record: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        record[key] = value.toString();
    });
    return record;
}

function redirectToSuccess(request: NextRequest, params: Record<string, string>): NextResponse {
    const baseUrl = getBaseUrl(request);
    const url = new URL('/checkout/success', baseUrl);

    if (params.txnid) url.searchParams.set('txnid', params.txnid);
    if (params.amount) url.searchParams.set('amount', params.amount);
    if (params.productinfo) url.searchParams.set('productinfo', params.productinfo);

    return NextResponse.redirect(url);
}

function redirectToFailure(request: NextRequest, message: string): NextResponse {
    const baseUrl = getBaseUrl(request);
    const url = new URL('/checkout/failure', baseUrl);
    url.searchParams.set('status', 'error');
    url.searchParams.set('message', message);
    return NextResponse.redirect(url);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('[PAYU SUCCESS] Callback received');
    try {
        const formData = await request.formData();
        const params: Record<string, string> = {};
        formData.forEach((value, key) => {
            params[key] = value.toString();
        });

        console.log('[PAYU SUCCESS] Params received:', {
            txnid: params.txnid,
            status: params.status,
            amount: params.amount,
            hash: params.hash ? 'present' : 'missing',
            email: params.email,
        });

        const result = await processPayUWebhook(params);
        console.log('[PAYU SUCCESS] Webhook result:', result);

        if (result.success) {
            return redirectToSuccess(request, params);
        } else {
            return redirectToFailure(request, result.message);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process PayU success callback';
        console.error('[PAYU SUCCESS] Error:', message);
        return redirectToFailure(request, message);
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log('[PAYU SUCCESS] GET callback received');
    const params = toRecordFromSearchParams(new URL(request.url).searchParams);
    return redirectToSuccess(request, params);
}
