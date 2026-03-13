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
    Zap,
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
        <div className="flex flex-col gap-1 px-6 py-6 transition-all duration-300">
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Grabcash" className="w-8 h-8 object-contain" />
                <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-gold">Grab</span>
                    <span className="text-xl font-bold text-white">Cash</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 px-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                    Powered by
                </span>
                <span className="text-[10px] font-black text-gold uppercase tracking-widest">
                    Poonawalla Pay
                </span>
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
                'group flex items-center gap-3 px-4 py-3 mx-3 rounded-2xl transition-all duration-300 no-underline relative overflow-hidden',
                isActive
                    ? 'bg-gold/10 text-gold shadow-[0_0_20px_rgba(163,230,53,0.1)]'
                    : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-white'
            )}
        >
            <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-gold text-black shadow-[0_0_15px_rgba(163,230,53,0.4)] scale-110" : "bg-zinc-900/50 text-zinc-500 group-hover:text-white"
            )}>
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-black tracking-tight uppercase">
                {item.label}
            </span>
            {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
            )}
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
        <div className="relative px-3">
            <button
                onClick={onToggle}
                className={cn(
                    'w-full flex items-center justify-between px-3 py-3 rounded-2xl',
                    'bg-zinc-900/60 border border-zinc-800/50 backdrop-blur-md',
                    'transition-all duration-300',
                    'hover:border-gold/40 hover:bg-zinc-900',
                    'focus:ring-1 focus:ring-gold/50 shadow-lg'
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.2)]">
                        <span className="text-xs font-black text-black">
                            {activePersona?.initials || '?'}
                        </span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-white tracking-tight leading-none mb-1">
                            {activePersona?.name || 'Select Persona'}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {activePersona?.role || 'Demo User'}
                        </span>
                    </div>
                </div>
                <ChevronUp
                    className={cn(
                        'w-4 h-4 text-zinc-600 transition-transform duration-300',
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
        <div className="px-3">
            <button
                onClick={onLogout}
                className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                    'text-zinc-500 font-bold text-sm tracking-tight',
                    'transition-all duration-200',
                    'hover:text-red hover:bg-red/5',
                    'focus:ring-1 focus:ring-red/50'
                )}
            >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
            </button>
        </div>
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
 * - Active state indicator (gold dot next to label)
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
                'sticky top-0 z-40 flex-shrink-0',
                'w-[var(--sidebar-width)]',
                'bg-[rgba(10,10,10,0.8)] backdrop-blur-2xl border-r border-zinc-800/30',
                'hidden md:flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)]',
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
