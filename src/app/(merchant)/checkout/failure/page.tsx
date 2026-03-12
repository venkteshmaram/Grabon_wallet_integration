export default function CheckoutFailurePage() {
    return (
        <div className="px-4 py-6 sm:px-0 max-w-md mx-auto text-center">
            <div className="bg-red-50 rounded-lg p-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                <p className="text-gray-600 mb-6">Something went wrong with your payment.</p>
                <a href="/merchants" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Try Again
                </a>
            </div>
        </div>
    )
}
