export default function TransactionsPage() {
    return (
        <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Transaction History</h1>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <p className="text-gray-500 text-center py-8">No transactions found</p>
                </div>
            </div>
        </div>
    )
}
