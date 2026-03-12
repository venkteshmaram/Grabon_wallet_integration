export default function AnalyticsPage() {
    return (
        <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white shadow rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500">Total Spending</h3>
                    <p className="text-2xl font-bold text-gray-900">₹0.00</p>
                </div>
                <div className="bg-white shadow rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500">Cashback Earned</h3>
                    <p className="text-2xl font-bold text-green-600">₹0.00</p>
                </div>
                <div className="bg-white shadow rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500">FD Returns</h3>
                    <p className="text-2xl font-bold text-blue-600">₹0.00</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a href="/analytics/spending" className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition">
                    <h3 className="text-lg font-medium text-gray-900">Spending Analysis</h3>
                    <p className="text-gray-600 mt-2">View detailed spending patterns</p>
                </a>
                <a href="/analytics/cashback" className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition">
                    <h3 className="text-lg font-medium text-gray-900">Cashback Report</h3>
                    <p className="text-gray-600 mt-2">Track your cashback earnings</p>
                </a>
                <a href="/analytics/investment" className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition">
                    <h3 className="text-lg font-medium text-gray-900">Investment Performance</h3>
                    <p className="text-gray-600 mt-2">Monitor your FD investments</p>
                </a>
            </div>
        </div>
    )
}
