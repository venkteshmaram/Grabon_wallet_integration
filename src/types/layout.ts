/**
 * Layout Component Types
 * Type definitions for navigation, personas, and layout structure
 */

import { LucideIcon } from 'lucide-react';

// ============================================
// NAVIGATION TYPES
// ============================================

/**
 * Navigation item for sidebar and mobile navigation
 */
export interface NavigationItem {
    /** Unique identifier for the nav item */
    id: string;
    /** Display label */
    label: string;
    /** Route path */
    href: string;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Optional badge count (e.g., notifications) */
    badge?: number;
    /** Whether this item requires authentication */
    requiresAuth?: boolean;
}

/**
 * Navigation section for grouping related items
 */
export interface NavigationSection {
    /** Section title */
    title: string;
    /** Navigation items in this section */
    items: NavigationItem[];
}

// ============================================
// PERSONA TYPES
// ============================================

/**
 * User persona for demo/testing purposes
 * Each persona represents a different user type with specific characteristics
 */
export interface Persona {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Email address for login */
    email: string;
    /** Password for demo login (always 'password123') */
    password: string;
    /** Persona role/type label */
    role: PersonaRole;
    /** Short description of the persona */
    description: string;
    /** Avatar initials (2 characters max) */
    initials: string;
    /** Avatar background color (if not using gold) */
    avatarColor?: string;
}

/**
 * Predefined persona roles
 */
export type PersonaRole =
    | 'Power User'
    | 'New User'
    | 'Traveler'
    | 'Saver'
    | 'Fraud Case';

/**
 * Persona with additional runtime data
 */
export interface PersonaWithStatus extends Persona {
    /** Whether this persona is currently active */
    isActive: boolean;
    /** Last login timestamp */
    lastLoginAt?: Date;
}

// ============================================
// LAYOUT TYPES
// ============================================

/**
 * Sidebar display state
 */
export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

/**
 * Breakpoint thresholds for responsive design
 */
export interface Breakpoints {
    /** Mobile: < 768px */
    mobile: number;
    /** Tablet: 768px - 1023px */
    tablet: number;
    /** Desktop: >= 1024px */
    desktop: number;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
    /** Sidebar width in pixels */
    sidebarWidth: number;
    /** Header height in pixels */
    headerHeight: number;
    /** Mobile navigation height in pixels */
    mobileNavHeight: number;
    /** Whether sidebar can be collapsed */
    collapsibleSidebar: boolean;
    /** Default sidebar state */
    defaultSidebarState: SidebarState;
}

// ============================================
// HEADER TYPES
// ============================================

/**
 * Header notification
 */
export interface HeaderNotification {
    /** Unique identifier */
    id: string;
    /** Notification title */
    title: string;
    /** Notification message */
    message: string;
    /** Timestamp */
    createdAt: Date;
    /** Whether notification has been read */
    isRead: boolean;
    /** Optional link to navigate on click */
    link?: string;
    /** Notification type for styling */
    type: 'info' | 'success' | 'warning' | 'error';
}

/**
 * User info displayed in header
 */
export interface HeaderUserInfo {
    /** User ID */
    id: string;
    /** Display name */
    name: string;
    /** Email address */
    email: string;
    /** Avatar URL (optional) */
    avatarUrl?: string;
    /** Avatar initials (fallback) */
    initials: string;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Default 5 personas as defined in PRD
 */
export const DEFAULT_PERSONAS: Persona[] = [
    {
        id: 'priya-sharma',
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        password: 'password123',
        role: 'Power User',
        description: 'Heavy user with consistent transaction patterns',
        initials: 'PS',
    },
    {
        id: 'arjun-mehta',
        name: 'Arjun Mehta',
        email: 'arjun.mehta@email.com',
        password: 'password123',
        role: 'New User',
        description: 'New user with limited transaction history',
        initials: 'AM',
    },
    {
        id: 'meera-nair',
        name: 'Meera Nair',
        email: 'meera.nair@email.com',
        password: 'password123',
        role: 'Traveler',
        description: 'Frequent traveler with seasonal spending spikes',
        initials: 'MN',
    },
    {
        id: 'rajan-kumar',
        name: 'Rajan Kumar',
        email: 'rajan.kumar@email.com',
        password: 'password123',
        role: 'Saver',
        description: 'Investment-focused user with multiple FDs',
        initials: 'RK',
    },
    {
        id: 'vikram-singh',
        name: 'Vikram Singh',
        email: 'vikram.singh@email.com',
        password: 'password123',
        role: 'Fraud Case',
        description: 'User with suspicious transaction patterns',
        initials: 'VS',
    },
];

/**
 * Main navigation items
 */
export const MAIN_NAVIGATION: NavigationItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard' as unknown as LucideIcon,
        requiresAuth: true,
    },
    {
        id: 'wallet',
        label: 'Wallet',
        href: '/wallet',
        icon: 'Wallet' as unknown as LucideIcon,
        requiresAuth: true,
    },
    {
        id: 'merchants',
        label: 'Merchants',
        href: '/merchants',
        icon: 'Store' as unknown as LucideIcon,
        requiresAuth: true,
    },
    {
        id: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: 'BarChart3' as unknown as LucideIcon,
        requiresAuth: true,
    },
];

/**
 * Breakpoint values (in pixels)
 */
export const BREAKPOINTS: Breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1024,
};

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
    sidebarWidth: 260,
    headerHeight: 64,
    mobileNavHeight: 64,
    collapsibleSidebar: false,
    defaultSidebarState: 'expanded',
};
