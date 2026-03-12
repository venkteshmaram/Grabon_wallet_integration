export default function FDDetailPage({ params }: { params: { fdId: string } }) {
    return (
        <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Fixed Deposit Details</h1>
            <p className="text-gray-600">FD ID: {params.fdId}</p>
        </div>
    )
}
