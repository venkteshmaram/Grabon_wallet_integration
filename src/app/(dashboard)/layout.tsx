/**
 * Dashboard Layout
 * 
 * Layout for authenticated dashboard pages.
 * Features:
 * - Fixed sidebar navigation (desktop)
 * - Fixed header with page title, time, and user info
 * - Mobile bottom navigation bar
 * - Responsive layout that adapts to all screen sizes
 * 
 * Layout Structure:
 * - Desktop: Sidebar (260px) + Header (64px) + Main Content
 * - Mobile: Header (64px) + Main Content + Bottom Nav (64px)
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar, Header, MobileNav } from '@/components/layout';
import { Persona, DEFAULT_PERSONAS } from '@/types/layout';

// ============================================
// TYPES
// ============================================

interface DashboardLayoutProps {
    children: React.ReactNode;
}

// ============================================
// MAIN DASHBOARD LAYOUT
// ============================================

export default function DashboardLayout({ children }: DashboardLayoutProps) {
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

        // TODO: In a real implementation, this would:
        // 1. Call login API with persona credentials
        // 2. Store JWT token
        // 3. Refresh wallet data for the new persona
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
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Sidebar - Desktop Only */}
            <Sidebar
                activePersona={activePersona}
                onPersonaSwitch={handlePersonaSwitch}
                onLogout={handleLogout}
            />

            {/* Header - Fixed Top */}
            <Header
                activePersona={activePersona}
            />

            {/* Main Content Area */}
            <main
                className={cn(
                    'pt-[var(--header-height)]',
                    'md:pl-[var(--sidebar-width)]',
                    'pb-[var(--mobile-nav-height)] md:pb-0',
                    'min-h-screen'
                )}
            >
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile Navigation - Mobile Only */}
            <MobileNav
                activePersona={activePersona}
                onPersonaSwitch={handlePersonaSwitch}
            />
        </div>
    );
}
