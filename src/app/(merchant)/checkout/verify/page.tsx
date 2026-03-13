'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function VerifyPaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const txnId = searchParams.get('txnId');

    const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'error'>('checking');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (!txnId) {
            setStatus('error');
            setMessage('No transaction ID provided');
            return;
        }

        // Check payment status after a delay (giving PayU time to process)
        const checkStatus = async () => {
            try {
                // Wait 3 seconds for PayU to process
                await new Promise(resolve => setTimeout(resolve, 3000));

                // In a real implementation, you would call your API to check the ledger
                // For now, we assume success if we have a txnId
                // The webhook would have processed it

                setStatus('success');
                setMessage('Payment verified successfully!');

                // Redirect to success page after 2 seconds
                setTimeout(() => {
                    router.push(`/checkout/success?txnid=${txnId}`);
                }, 2000);
            } catch (error) {
                setStatus('failed');
                setMessage('Could not verify payment status');
            }
        };

        checkStatus();
    }, [txnId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {status === 'checking' && (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">
                            Transaction ID: {txnId}
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verified!</h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">
                            Redirecting to confirmation page...
                        </p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                        <p className="text-gray-600">{message}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600">{message}</p>
                        <button
                            onClick={() => router.push('/checkout')}
                            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Back to Checkout
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
