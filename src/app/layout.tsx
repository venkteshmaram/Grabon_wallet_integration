import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'GrabCash Wallet',
    description: 'Digital Wallet with Fraud Detection & FD Investment',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
