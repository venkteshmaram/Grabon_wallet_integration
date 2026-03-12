'use client'

import { useState } from 'react'

export default function QRPayPage() {
    const [scanning, setScanning] = useState(false)

    return (
        <div className="px-4 py-6 sm:px-0 max-w-md mx-auto text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Scan QR Code</h1>

            <div className="bg-white shadow rounded-lg p-8">
                <div className="w-64 h-64 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    {scanning ? (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">Scanning...</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">Camera preview will appear here</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setScanning(!scanning)}
                    className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                    {scanning ? 'Stop Scanning' : 'Start Scanning'}
                </button>
            </div>
        </div>
    )
}
