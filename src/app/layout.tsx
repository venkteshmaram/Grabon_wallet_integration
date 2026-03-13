import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: {
        default: 'GrabCash Wallet',
        template: '%s | GrabCash',
    },
    description: 'Digital Wallet with Fraud Detection & FD Investment - Your cashback. Invested.',
    keywords: ['wallet', 'cashback', 'fixed deposit', 'fintech', 'investment', 'GrabCash'],
    authors: [{ name: 'GrabCash Team' }],
    creator: 'GrabCash',
    publisher: 'GrabCash',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        siteName: 'GrabCash Wallet',
        title: 'GrabCash Wallet',
        description: 'Digital Wallet with Fraud Detection & FD Investment',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'GrabCash Wallet',
        description: 'Digital Wallet with Fraud Detection & FD Investment',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#1A1A1A',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
