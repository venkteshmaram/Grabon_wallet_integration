export default function DashboardPage() {
    return (
        <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome to your GrabCash Wallet dashboard.</p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="text-sm font-medium text-gray-500 truncate">Available Balance</div>
                                <div className="mt-1 text-2xl font-semibold text-gray-900">₹0.00</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <a href="/wallet" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            View wallet
                        </a>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="text-sm font-medium text-gray-500 truncate">Pending Cashback</div>
                                <div className="mt-1 text-2xl font-semibold text-gray-900">₹0.00</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <a href="/analytics/cashback" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            View cashback
                        </a>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="text-sm font-medium text-gray-500 truncate">Active FDs</div>
                                <div className="mt-1 text-2xl font-semibold text-gray-900">0</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                        <a href="/wallet/invest" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            View investments
                        </a>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <a
                            href="/wallet/fund"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Add Money
                        </a>
                        <a
                            href="/wallet/transfer"
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Transfer
                        </a>
                        <a
                            href="/merchants"
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Pay at Merchant
                        </a>
                        <a
                            href="/wallet/invest"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                            Create FD
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
