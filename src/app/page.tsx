import Link from 'next/link'

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">GrabCash Wallet</h1>
            <p className="text-lg mb-8">Digital Wallet with Fraud Detection & FD Investment</p>
            <div className="flex gap-4">
                <Link
                    href="/login"
                    className="rounded bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
                >
                    Login
                </Link>
                <Link
                    href="/register"
                    className="rounded bg-green-500 px-6 py-3 text-white hover:bg-green-600"
                >
                    Register
                </Link>
            </div>
        </main>
    )
}
