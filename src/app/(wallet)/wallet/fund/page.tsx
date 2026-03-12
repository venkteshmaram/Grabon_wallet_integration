'use client'

import { useState } from 'react'

export default function FundWalletPage() {
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLoading(false)
        alert('Redirecting to payment gateway...')
    }

    return (
        <div className="px-4 py-6 sm:px-0 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Add Money to Wallet</h1>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₹)
                    </label>
                    <input
                        type="number"
                        min="10"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter amount"
                    />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                    {[100, 500, 1000, 2000, 5000, 10000].map((amt) => (
                        <button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(amt.toString())}
                            className="py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                        >
                            ₹{amt}
                        </button>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Add Money'}
                </button>
            </form>
        </div>
    )
}
