export default function WalletPage() {
    return (
        <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-semibold text-gray-900">My Wallet</h1>

            <div className="mt-6 bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-gray-500">Available Balance</p>
                        <p className="text-3xl font-bold text-gray-900">₹0.00</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Pending Balance</p>
                        <p className="text-3xl font-bold text-yellow-600">₹0.00</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Locked in FDs</p>
                        <p className="text-3xl font-bold text-blue-600">₹0.00</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Lifetime Earned</p>
                        <p className="text-3xl font-bold text-green-600">₹0.00</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="/wallet/fund" className="bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700">
                    Add Money
                </a>
                <a href="/wallet/transfer" className="bg-gray-600 text-white text-center py-3 rounded-lg hover:bg-gray-700">
                    Transfer
                </a>
                <a href="/wallet/invest" className="bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700">
                    Invest in FD
                </a>
                <a href="/wallet/transactions" className="bg-purple-600 text-white text-center py-3 rounded-lg hover:bg-purple-700">
                    History
                </a>
            </div>
        </div>
    )
}
