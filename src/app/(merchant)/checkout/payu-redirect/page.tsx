export default function PayURedirectPage() {
    return (
        <div className="px-4 py-6 sm:px-0 max-w-md mx-auto text-center">
            <div className="bg-white shadow rounded-lg p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Redirecting to PayU...</h2>
                <p className="text-gray-600">Please wait while we redirect you to the payment gateway.</p>
            </div>
        </div>
    )
}
