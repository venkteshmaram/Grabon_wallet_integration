'use client'

import { useState } from 'react'

export default function InvestPage() {
    const [amount, setAmount] = useState('')
    const [tenure, setTenure] = useState('30')
    const [loading, setLoading] = useState(false)

    const interestRate = 7.5
    const calculatedInterest = amount ? (parseFloat(amount) * interestRate * parseInt(tenure) / 36500).toFixed(2) : '0'
    const maturityAmount = amount ? (parseFloat(amount) + parseFloat(calculatedInterest)).toFixed(2) : '0'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLoading(false)
        alert('FD created successfully!')
    }

    return (
        <div className="px-4 py-6 sm:px-0 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create Fixed Deposit</h1>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Principal Amount (₹)
                    </label>
                    <input
                        type="number"
                        min="500"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Min ₹500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tenure (Days)
                    </label>
                    <select
                        value={tenure}
                        onChange={(e) => setTenure(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">1 year</option>
                    </select>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Interest Rate</span>
                        <span className="text-sm font-medium">{interestRate}% p.a.</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Interest Earned</span>
                        <span className="text-sm font-medium text-green-600">₹{calculatedInterest}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium text-gray-900">Maturity Amount</span>
                        <span className="text-lg font-bold text-gray-900">₹{maturityAmount}</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !amount || parseFloat(amount) < 500}
                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create FD'}
                </button>
            </form>
        </div>
    )
}
