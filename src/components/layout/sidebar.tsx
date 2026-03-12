/**
 * Sidebar Component
 * 
 * Fixed left sidebar with:
 * - GrabCash logo
 * - Navigation items (Dashboard, Wallet, Merchants, Analytics)
 * - Persona switcher dropdown
 * - Logout button
 * 
 * Mobile: Collapses to bottom tab bar (handled by MobileNav component)
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Wallet,
    Store,
    BarChart3,
    LogOut,
    ChevronUp,
    User,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Persona, DEFAULT_PERSONAS } from '@/types/layout';

// ============================================
// NAVIGATION CONFIGURATION
// ============================================

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { id: 'wallet', label: 'Wallet', href: '/wallet', icon: Wallet },
    { id: 'merchants', label: 'Merchants', href: '/merchants', icon: Store },
    { id: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

// ============================================
// TYPES
// ============================================

interface SidebarProps {
    /** Currently active persona */
    activePersona?: Persona | null;
    /** Callback when persona is switched */
    onPersonaSwitch?: (persona: Persona) => void;
    /** Callback when logout is clicked */
    onLogout?: () => void;
    /** Additional CSS classes */
    className?: string;
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Logo component - GrabCash branding
 */
const Logo = React.memo(function Logo() {
    return (
        <div className="flex items-center gap-2 px-4 py-6">
            <div className="flex flex-col">
                <span className="text-xl font-bold text-[var(--gold)]">GrabCash</span>
                <span className="text-sm font-normal text-[var(--text-primary)]">Wallet</span>
            </div>
        </div>
    );
});

/**
 * Navigation Item component
 */
interface NavItemProps {
    item: NavItem;
    isActive: boolean;
}

const NavigationItem = React.memo(function NavigationItem({ item, isActive }: NavItemProps) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                'group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg',
                'transition-colors-fast no-underline',
                isActive
                    ? 'bg-[rgba(245,166,35,0.12)] border-l-[3px] border-[#F5A623] text-[#F5A623]'
                    : 'border-l-[3px] border-transparent text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-[#F8F8F8]'
            )}
        >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">
                {item.label}
            </span>
        </Link>
    );
});

/**
 * Persona Switcher Dropdown
 */
interface PersonaSwitcherProps {
    activePersona: Persona | null;
    personas: Persona[];
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (persona: Persona) => void;
}

const PersonaSwitcher = React.memo(function PersonaSwitcher({
    activePersona,
    personas,
    isOpen,
    onToggle,
    onSelect,
}: PersonaSwitcherProps) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className={cn(
                    'w-full flex items-center justify-between px-4 py-3 mx-2 rounded-lg',
                    'border border-[var(--bg-border)]',
                    'transition-colors-fast',
                    'hover:border-[var(--gold-border)] hover:bg-[var(--gold-subtle)]',
                    'focus-ring'
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center">
                        <span className="text-sm font-bold text-[var(--text-inverse)]">
                            {activePersona?.initials || '?'}
                        </span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                            {activePersona?.name || 'Select Persona'}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                            {activePersona?.role || 'Demo User'}
                        </span>
                    </div>
                </div>
                <ChevronUp
                    className={cn(
                        'w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200',
                        isOpen ? 'rotate-180' : 'rotate-0'
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute bottom-full left-0 right-0 mb-2',
                        'bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-lg',
                        'shadow-lg overflow-hidden',
                        'animate-fade-in-up'
                    )}
                    role="listbox"
                >
                    <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                            Switch Persona
                        </div>
                        {personas.map((persona) => (
                            <button
                                key={persona.id}
                                onClick={() => onSelect(persona)}
                                className={cn(
                                    'w-full flex items-center justify-between px-4 py-3',
                                    'hover:bg-[var(--bg-hover)] transition-colors-fast',
                                    activePersona?.id === persona.id && 'bg-[var(--gold-subtle)]'
                                )}
                                role="option"
                                aria-selected={activePersona?.id === persona.id}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                        {persona.name}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        {persona.role}
                                    </span>
                                </div>
                                {activePersona?.id === persona.id && (
                                    <Check className="w-4 h-4 text-[var(--gold)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

/**
 * Logout Button
 */
interface LogoutButtonProps {
    onLogout: () => void;
}

const LogoutButton = React.memo(function LogoutButton({ onLogout }: LogoutButtonProps) {
    return (
        <button
            onClick={onLogout}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg',
                'text-[var(--text-secondary)]',
                'transition-colors-fast',
                'hover:text-[var(--red)] hover:bg-[var(--red-muted)]',
                'focus-ring'
            )}
        >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
        </button>
    );
});

// ============================================
// MAIN SIDEBAR COMPONENT
// ============================================

/**
 * Sidebar navigation component
 * 
 * Features:
 * - Fixed 260px width on desktop
 * - Dark charcoal background with gold accents
 * - Active state indicator (gold left border)
 * - Persona switcher with dropdown
 * - Logout button
 * 
 * Mobile: This component is hidden on mobile (< 768px).
 * Mobile navigation is handled by MobileNav component.
 */
export function Sidebar({
    activePersona = null,
    onPersonaSwitch,
    onLogout,
    className,
}: SidebarProps) {
    const pathname = usePathname();
    const [isPersonaOpen, setIsPersonaOpen] = useState(false);

    // Toggle persona dropdown
    const handleTogglePersona = useCallback(() => {
        setIsPersonaOpen((prev) => !prev);
    }, []);

    // Close persona dropdown when selecting
    const handleSelectPersona = useCallback(
        (persona: Persona) => {
            setIsPersonaOpen(false);
            onPersonaSwitch?.(persona);
        },
        [onPersonaSwitch]
    );

    // Handle logout
    const handleLogout = useCallback(() => {
        onLogout?.();
    }, [onLogout]);

    // Memoize active route check
    const isActiveRoute = useCallback(
        (href: string) => {
            if (href === '/dashboard') {
                return pathname === '/dashboard' || pathname === '/';
            }
            return pathname?.startsWith(href);
        },
        [pathname]
    );

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 bottom-0 z-40',
                'w-[var(--sidebar-width)]',
                'bg-[#242424] border-r border-[#2E2E2E]',
                'hidden md:flex flex-col',
                className
            )}
        >
            {/* Logo Section */}
            <div className="flex-shrink-0 border-b border-[var(--bg-border)]">
                <Logo />
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                <ul className="space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <li key={item.id}>
                            <NavigationItem item={item} isActive={isActiveRoute(item.href)} />
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Bottom Section - Persona & Logout */}
            <div className="flex-shrink-0 border-t border-[var(--bg-border)] py-4 space-y-2">
                <PersonaSwitcher
                    activePersona={activePersona}
                    personas={DEFAULT_PERSONAS}
                    isOpen={isPersonaOpen}
                    onToggle={handleTogglePersona}
                    onSelect={handleSelectPersona}
                />
                <LogoutButton onLogout={handleLogout} />
            </div>
        </aside>
    );
}

// ============================================
// EXPORTS
// ============================================

export type { SidebarProps };
export { NAV_ITEMS };
