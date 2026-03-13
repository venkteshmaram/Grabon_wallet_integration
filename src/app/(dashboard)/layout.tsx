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
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';

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
    const { isAuthenticated, userId, loginAsPersona, logout } = useAuthStore();
    const { refreshAll, clearStore } = useWalletStore();

    // State for local UI synchronization
    const [activePersona, setActivePersona] = useState<Persona | null>(null);

    // Auth guard and initial data loading
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Identify active persona from current user email if possible
        const userEmail = useAuthStore.getState().userEmail;
        if (userEmail) {
            const persona = DEFAULT_PERSONAS.find((p) => p.email === userEmail);
            if (persona) {
                setActivePersona(persona);
            }
        }

        // Initial data fetch if authenticated
        if (userId) {
            refreshAll(userId);
        }
    }, [isAuthenticated, userId, router, refreshAll]);

    // Handle persona switch
    const handlePersonaSwitch = useCallback(async (persona: Persona) => {
        try {
            // 1. Perform quick login via auth store
            const result = await loginAsPersona(persona.email);

            if (result.success) {
                setActivePersona(persona);
                // 2. Fetch all data for the new user context
                const newUserId = useAuthStore.getState().userId;
                if (newUserId) {
                    await refreshAll(newUserId);
                }
                console.log(`Successfully switched to persona: ${persona.name}`);
            } else {
                console.error('Failed to switch persona:', result.error);
            }
        } catch (error) {
            console.error('Error during persona switch:', error);
        }
    }, [loginAsPersona, refreshAll]);

    // Handle logout
    const handleLogout = useCallback(() => {
        clearStore();
        logout();
        router.push('/login');
    }, [router, logout, clearStore]);

    // Show loading state or guard
    if (!isAuthenticated && typeof window !== 'undefined') {
        return null; // Let the useEffect handle the redirect
    }

    return (
        <div className="flex h-full overflow-hidden bg-[var(--bg-primary)]">
            {/* Sidebar - Desktop Only */}
            <Sidebar
                activePersona={activePersona}
                onPersonaSwitch={handlePersonaSwitch}
                onLogout={handleLogout}
            />

            {/* Right Side Content Column */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto scroll-smooth">
                    {/* Header - Sticky in-flow */}
                    <Header
                        activePersona={activePersona}
                    />

                    <main className="pb-[var(--mobile-nav-height)] md:pb-0">
                        <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 pt-0">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Navigation - Mobile Only */}
            <MobileNav
                activePersona={activePersona}
                onPersonaSwitch={handlePersonaSwitch}
            />
        </div>
    );
}
