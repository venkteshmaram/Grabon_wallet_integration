export default function MerchantDetailPage({ params }: { params: { merchantId: string } }) {
    return (
        <div className="px-4 py-6 sm:px-0 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Pay Merchant</h1>
            <p className="text-gray-600 mb-4">Merchant ID: {params.merchantId}</p>

            <form className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₹)
                    </label>
                    <input
                        type="number"
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter amount"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                    Pay Now
                </button>
            </form>
        </div>
    )
}
