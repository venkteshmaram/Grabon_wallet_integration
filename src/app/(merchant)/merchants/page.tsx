export default function MerchantsPage() {
    const merchants = [
        { id: 1, name: 'Amazon', category: 'Shopping', rate: '2%' },
        { id: 2, name: 'Flipkart', category: 'Shopping', rate: '1.5%' },
        { id: 3, name: 'Zomato', category: 'Food', rate: '5%' },
        { id: 4, name: 'Swiggy', category: 'Food', rate: '4%' },
        { id: 5, name: 'Myntra', category: 'Fashion', rate: '3%' },
    ]

    return (
        <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Partner Merchants</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {merchants.map((merchant) => (
                    <div key={merchant.id} className="bg-white shadow rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900">{merchant.name}</h3>
                        <p className="text-sm text-gray-500">{merchant.category}</p>
                        <div className="mt-2 flex justify-between items-center">
                            <span className="text-green-600 font-medium">{merchant.rate} cashback</span>
                            <a
                                href={`/merchants/${merchant.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Pay Now
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center">
                <a
                    href="/qr-pay"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    Scan QR to Pay
                </a>
            </div>
        </div>
    )
}
