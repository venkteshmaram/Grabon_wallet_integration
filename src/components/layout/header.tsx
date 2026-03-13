/**
 * Header Component
 * 
 * Fixed top bar with:
 * - Current page title
 * - IST date and time display
 * - Notification bell icon (decorative)
 * - User avatar with initials
 * - User name display
 * 
 * Responsive: Adapts to mobile with reduced elements
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Persona } from '@/types/layout';

// ============================================
// TYPES
// ============================================

interface HeaderProps {
    /** Currently active persona */
    activePersona?: Persona | null;
    /** Page title override (defaults to route-based title) */
    pageTitle?: string;
    /** Callback to toggle mobile menu */
    onMenuToggle?: () => void;
    /** Whether mobile menu is open */
    isMobileMenuOpen?: boolean;
    /** Additional CSS classes */
    className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const TIMEZONE = 'Asia/Kolkata';
const TIMEZONE_OFFSET = 330; // IST is UTC+5:30 = 330 minutes

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/wallet': 'Wallet',
    '/wallet/transactions': 'Transaction History',
    '/wallet/invest': 'Invest in FD',
    '/wallet/fund': 'Add Funds',
    '/wallet/transfer': 'Transfer',
    '/merchants': 'Merchants',
    '/merchants/checkout': 'Checkout',
    '/analytics': 'Analytics',
    '/analytics/cashback': 'Cashback Analytics',
    '/analytics/investment': 'Investment Analytics',
    '/analytics/spending': 'Spending Analytics',
    '/login': 'Sign In',
    '/register': 'Create Account',
    '/forgot-password': 'Reset Password',
    '/verify-otp': 'Verify OTP',
};

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Page Title component
 */
interface PageTitleProps {
    title: string;
}

const PageTitle = React.memo(function PageTitle({ title }: PageTitleProps) {
    return (
        <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">
            {title}
        </h1>
    );
});

/**
 * Format date to IST string
 * Uses native Intl API for timezone conversion
 */
function formatISTDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
        timeZone: TIMEZONE,
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format time to IST string
 */
function formatISTTime(date: Date): string {
    return date.toLocaleTimeString('en-IN', {
        timeZone: TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * DateTime display component
 * Shows current date and time in IST
 */
const DateTimeDisplay = React.memo(function DateTimeDisplay() {
    const [mounted, setMounted] = useState(false);
    const [dateTime, setDateTime] = useState<Date | null>(null);

    useEffect(() => {
        setMounted(true);
        setDateTime(new Date());

        // Update every second
        const interval = setInterval(() => {
            setDateTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted || !dateTime) {
        return (
            <div className="hidden sm:flex items-center text-sm text-[var(--text-secondary)]">
                <span className="skeleton w-32 h-4 rounded" />
                <span className="mx-2 text-[var(--text-tertiary)]">·</span>
                <span className="skeleton w-16 h-4 rounded" />
            </div>
        );
    }

    // Format in IST
    const dateStr = formatISTDate(dateTime);
    const timeStr = formatISTTime(dateTime);

    return (
        <div className="hidden sm:flex items-center text-sm text-[var(--text-secondary)]">
            <span>{dateStr}</span>
            <span className="mx-2 text-[var(--text-tertiary)]">·</span>
            <span className="font-medium">{timeStr}</span>
        </div>
    );
});

/**
 * Notification Bell component
 */
const NotificationBell = React.memo(function NotificationBell() {
    return (
        <button
            className={cn(
                'relative p-2 rounded-lg',
                'text-[var(--text-secondary)]',
                'hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                'transition-colors-fast',
                'focus-ring'
            )}
            aria-label="Notifications"
        >
            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {/* Decorative notification dot */}
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-gold rounded-full shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
        </button>
    );
});

/**
 * User Avatar component
 */
interface UserAvatarProps {
    initials: string;
    name: string;
}

const UserAvatar = React.memo(function UserAvatar({ initials, name }: UserAvatarProps) {
    return (
        <div className="flex items-center gap-3">
            <div
                className={cn(
                    'w-10 h-10 rounded-full',
                    'bg-[var(--gold)]',
                    'flex items-center justify-center',
                    'flex-shrink-0'
                )}
                aria-label={`${name}'s avatar`}
            >
                <span className="text-sm font-bold text-[var(--text-inverse)]">
                    {initials}
                </span>
            </div>
            <span className="hidden lg:block text-sm font-medium text-[var(--text-primary)]">
                {name}
            </span>
        </div>
    );
});

/**
 * Mobile Menu Toggle Button
 */
interface MobileMenuToggleProps {
    isOpen: boolean;
    onToggle: () => void;
}

const MobileMenuToggle = React.memo(function MobileMenuToggle({
    isOpen,
    onToggle,
}: MobileMenuToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                'md:hidden p-2 rounded-lg',
                'text-[var(--text-secondary)]',
                'hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                'transition-colors-fast',
                'focus-ring'
            )}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
        >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
    );
});

// ============================================
// MAIN HEADER COMPONENT
// ============================================

/**
 * Get page title from pathname
 */
function getPageTitle(pathname: string | null): string {
    if (!pathname) return 'GrabCash';

    // Check for exact match first
    if (PAGE_TITLES[pathname]) {
        return PAGE_TITLES[pathname];
    }

    // Check for partial matches (for nested routes)
    for (const [route, title] of Object.entries(PAGE_TITLES)) {
        if (pathname.startsWith(route) && route !== '/') {
            return title;
        }
    }

    // Default to Dashboard for root
    if (pathname === '/') {
        return 'Dashboard';
    }

    return 'GrabCash';
}

/**
 * Header component
 * 
 * Features:
 * - Fixed 64px height
 * - Page title based on current route
 * - IST date and time (auto-updating)
 * - Notification bell (decorative)
 * - User avatar and name
 * - Mobile hamburger menu toggle
 */
export function Header({
    activePersona,
    pageTitle,
    onMenuToggle,
    isMobileMenuOpen = false,
    className,
}: HeaderProps) {
    const pathname = usePathname();

    // Get page title from route or prop
    const title = useMemo(() => {
        return pageTitle || getPageTitle(pathname);
    }, [pageTitle, pathname]);

    // Handle menu toggle
    const handleToggle = useCallback(() => {
        onMenuToggle?.();
    }, [onMenuToggle]);

    return (
        <header
            className={cn(
                'sticky top-0 z-30 transition-all duration-300',
                'h-[var(--header-height)] w-full',
                'bg-[rgba(10,10,10,0.7)] backdrop-blur-xl border-b border-zinc-800/30 shadow-sm',
                className
            )}
        >
            <div className="h-full flex items-center justify-between px-4 sm:px-6">
                {/* Left Section - Title & Mobile Toggle */}
                <div className="flex items-center gap-4">
                    <MobileMenuToggle isOpen={isMobileMenuOpen} onToggle={handleToggle} />
                    <PageTitle title={title} />
                </div>

                {/* Right Section - DateTime, Notifications, User */}
                <div className="flex items-center gap-4">
                    <DateTimeDisplay />
                    <NotificationBell />
                    {activePersona ? (
                        <UserAvatar initials={activePersona.initials} name={activePersona.name} />
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
                                <User className="w-5 h-5 text-[var(--text-tertiary)]" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

// ============================================
// EXPORTS
// ============================================

export type { HeaderProps };
