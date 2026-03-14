/**
 * Merchant Layout
 * 
 * Layout for merchant and checkout pages.
 * Shares the same structure as dashboard layout with sidebar and header.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, Header, MobileNav } from '@/components/layout';
import { Persona, DEFAULT_PERSONAS } from '@/types/layout';

// ============================================
// TYPES
// ============================================

interface MerchantLayoutProps {
    children: React.ReactNode;
}

// ============================================
// MAIN MERCHANT LAYOUT
// ============================================

export default function MerchantLayout({ children }: MerchantLayoutProps) {
    const router = useRouter();

    // State for active persona
    const [activePersona, setActivePersona] = useState<Persona | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load persona from localStorage on mount
    useEffect(() => {
        const storedPersonaId = localStorage.getItem('activePersonaId');
        if (storedPersonaId) {
            const persona = DEFAULT_PERSONAS.find((p) => p.id === storedPersonaId);
            if (persona) {
                setActivePersona(persona);
            }
        }
        setIsLoading(false);
    }, []);

    // Handle persona switch
    const handlePersonaSwitch = useCallback((persona: Persona) => {
        setActivePersona(persona);
        localStorage.setItem('activePersonaId', persona.id);
        console.log(`Switched to persona: ${persona.name} (${persona.email})`);
    }, []);

    // Handle logout
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('activePersonaId');
        router.push('/login');
    }, [router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full spinner" />
                    <span className="text-[var(--text-secondary)] text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)]">
            {/* Sidebar - Desktop Only */}
            <Sidebar
                activePersona={activePersona}
                onPersonaSwitch={handlePersonaSwitch}
                onLogout={handleLogout}
                className="h-screen sticky top-0"
            />

            {/* Right Side Content Column */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header - Sticky */}
                <Header
                    activePersona={activePersona}
                />

                {/* Main Content Area */}
                <main className="flex-1 pb-[var(--mobile-nav-height)] lg:pb-0">
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 pt-0">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Navigation - Mobile Only */}
            <MobileNav
                activePersona={activePersona}
                onPersonaSwitch={handlePersonaSwitch}
            />
        </div>
    );
}
