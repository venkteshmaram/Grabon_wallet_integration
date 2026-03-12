export default function CheckoutSuccessPage() {
    return (
        <div className="px-4 py-6 sm:px-0 max-w-md mx-auto text-center">
            <div className="bg-green-50 rounded-lg p-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-6">Your transaction has been completed.</p>
                <a href="/dashboard" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Go to Dashboard
                </a>
            </div>
        </div>
    )
}
