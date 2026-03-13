/**
 * Mobile Navigation Component
 * 
 * Fixed bottom tab bar for mobile devices (< 768px)
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
    User,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Persona, DEFAULT_PERSONAS } from '@/types/layout';

// ============================================
// TYPES
// ============================================

interface MobileNavProps {
    activePersona?: Persona | null;
    onPersonaSwitch?: (persona: Persona) => void;
    className?: string;
}

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: React.ElementType;
}

// ============================================
// NAVIGATION CONFIGURATION
// ============================================

const MOBILE_NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { id: 'wallet', label: 'Wallet', href: '/wallet', icon: Wallet },
    { id: 'merchants', label: 'Merchants', href: '/merchants', icon: Store },
    { id: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

// ============================================
// MOBILE NAV ITEM COMPONENT
// ============================================

interface MobileNavItemProps {
    item: NavItem;
    isActive: boolean;
}

const MobileNavItem = React.memo(function MobileNavItem({
    item,
    isActive,
}: MobileNavItemProps) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                'flex flex-col items-center justify-center',
                'w-full h-full relative transition-colors-fast'
            )}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
        >
            {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-gold rounded-full shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
            )}
            <Icon
                className={cn(
                    'w-6 h-6 transition-colors-fast',
                    isActive ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'
                )}
            />
            <span
                className={cn(
                    'text-[10px] mt-1 font-medium transition-colors-fast hidden sm:block',
                    isActive ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'
                )}
            >
                {item.label}
            </span>
        </Link>
    );
});

// ============================================
// MOBILE PERSONA BUTTON
// ============================================

interface MobilePersonaButtonProps {
    activePersona: Persona | null | undefined;
    isActive: boolean;
    onClick: () => void;
}

const MobilePersonaButton = React.memo(function MobilePersonaButton({
    activePersona,
    isActive,
    onClick,
}: MobilePersonaButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center justify-center w-full h-full relative transition-colors-fast'
            )}
            aria-label="Switch persona"
        >
            {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-gold rounded-full shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
            )}
            {activePersona ? (
                <div className="w-7 h-7 rounded-full bg-[var(--gold)] flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--text-inverse)]">
                        {activePersona.initials}
                    </span>
                </div>
            ) : (
                <User className={cn(
                    'w-6 h-6 transition-colors-fast',
                    isActive ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'
                )} />
            )}
            <span className={cn(
                'text-[10px] mt-1 font-medium transition-colors-fast hidden sm:block',
                isActive ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'
            )}>
                Profile
            </span>
        </button>
    );
});

// ============================================
// PERSONA MODAL
// ============================================

interface PersonaModalProps {
    isOpen: boolean;
    activePersona: Persona | null | undefined;
    onClose: () => void;
    onSelect: (persona: Persona) => void;
}

const PersonaModal = React.memo(function PersonaModal({
    isOpen,
    activePersona,
    onClose,
    onSelect,
}: PersonaModalProps) {
    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={cn(
                    'fixed bottom-[calc(var(--mobile-nav-height)+16px)] left-4 right-4',
                    'bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-xl p-4 z-50',
                    'max-h-[60vh] overflow-y-auto animate-slide-in-up'
                )}
                role="dialog"
                aria-modal="true"
                aria-label="Switch Persona"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        Switch Persona
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)]"
                        aria-label="Close"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                </div>

                <div className="space-y-2">
                    {DEFAULT_PERSONAS.map((persona) => (
                        <button
                            key={persona.id}
                            onClick={() => onSelect(persona)}
                            className={cn(
                                'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors-fast',
                                activePersona?.id === persona.id
                                    ? 'bg-[var(--gold-muted)] border border-[var(--gold-border)]'
                                    : 'hover:bg-[var(--bg-hover)] border border-transparent'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--gold)] flex items-center justify-center">
                                    <span className="text-sm font-bold text-[var(--text-inverse)]">
                                        {persona.initials}
                                    </span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                        {persona.name}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        {persona.role}
                                    </span>
                                </div>
                            </div>
                            {activePersona?.id === persona.id && (
                                <Check className="w-5 h-5 text-[var(--gold)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
});

// ============================================
// MAIN MOBILE NAV COMPONENT
// ============================================

export function MobileNav({
    activePersona,
    onPersonaSwitch,
    className,
}: MobileNavProps) {
    const pathname = usePathname();
    const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

    const isProfileActive = useMemo(() => {
        return pathname?.startsWith('/profile') || pathname?.startsWith('/settings');
    }, [pathname]);

    const isActiveRoute = useCallback(
        (href: string) => {
            if (href === '/dashboard') {
                return pathname === '/dashboard' || pathname === '/';
            }
            return pathname?.startsWith(href);
        },
        [pathname]
    );

    const handleTogglePersonaModal = useCallback(() => {
        setIsPersonaModalOpen((prev) => !prev);
    }, []);

    const handleSelectPersona = useCallback(
        (persona: Persona) => {
            setIsPersonaModalOpen(false);
            onPersonaSwitch?.(persona);
        },
        [onPersonaSwitch]
    );

    const handleCloseModal = useCallback(() => {
        setIsPersonaModalOpen(false);
    }, []);

    return (
        <>
            <nav
                className={cn(
                    'fixed bottom-0 left-0 right-0 z-30 h-[var(--mobile-nav-height)]',
                    'bg-[rgba(15,15,15,0.85)] backdrop-blur-2xl border-t border-zinc-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]',
                    'md:hidden pb-safe',
                    className
                )}
            >
                <div className="h-full flex items-center justify-around">
                    {MOBILE_NAV_ITEMS.map((item) => (
                        <MobileNavItem
                            key={item.id}
                            item={item}
                            isActive={isActiveRoute(item.href)}
                        />
                    ))}
                    <MobilePersonaButton
                        activePersona={activePersona}
                        isActive={isProfileActive || isPersonaModalOpen}
                        onClick={handleTogglePersonaModal}
                    />
                </div>
            </nav>

            <PersonaModal
                isOpen={isPersonaModalOpen}
                activePersona={activePersona}
                onClose={handleCloseModal}
                onSelect={handleSelectPersona}
            />
        </>
    );
}

export type { MobileNavProps };
export { MOBILE_NAV_ITEMS };
