import { NextRequest, NextResponse } from 'next/server';
import { processPayUWebhook } from '@/services/payu';

// Get base URL from env or request - required for ngrok compatibility
function getBaseUrl(request: NextRequest): string {
    // Try to extract base from PAYU_FAILURE_URL env var (most reliable with ngrok)
    const failureUrl = process.env.PAYU_FAILURE_URL;
    if (failureUrl) {
        try {
            const url = new URL(failureUrl);
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

function redirectToFailure(request: NextRequest, params: Record<string, string>, fallbackMessage?: string): NextResponse {
    const baseUrl = getBaseUrl(request);
    const url = new URL('/checkout/failure', baseUrl);
    url.searchParams.set('status', params.status || 'failure');
    url.searchParams.set('message', params.error_Message || params.error || fallbackMessage || 'Payment failed');
    return NextResponse.redirect(url);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('[PAYU FAILURE] Callback received');
    try {
        const formData = await request.formData();
        const params: Record<string, string> = {};
        formData.forEach((value, key) => {
            params[key] = value.toString();
        });

        console.log('[PAYU FAILURE] Params received:', {
            txnid: params.txnid,
            status: params.status,
            amount: params.amount,
            error: params.error,
            error_Message: params.error_Message,
            hash: params.hash ? 'present' : 'missing',
        });

        // Don't process webhook for failure, just log and redirect
        return redirectToFailure(request, params);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process PayU failure callback';
        console.error('[PAYU FAILURE] Error:', message);
        return redirectToFailure(request, {}, message);
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log('[PAYU FAILURE] GET callback received');
    const params = toRecordFromSearchParams(new URL(request.url).searchParams);
    return redirectToFailure(request, params);
}
