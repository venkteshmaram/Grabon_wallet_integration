// ============================================
// AUTH LAYOUT - Dark Charcoal + Gold Theme
// Step 2: Auth Pages - Shared layout for all auth pages
// ============================================

import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8">
            {/* Background gradient decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--gold)] opacity-[0.03] rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--gold)] opacity-[0.02] rounded-full blur-3xl" />
            </div>

            {/* Main content card */}
            <div className="relative z-10 w-full max-w-[420px]">
                {children}
            </div>
        </div>
    );
}
