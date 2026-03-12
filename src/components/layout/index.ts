/**
 * Layout Components
 * 
 * Export all layout-related components from a single entry point.
 * This follows the barrel export pattern for cleaner imports.
 * 
 * @example
 * import { Sidebar, Header, MobileNav } from '@/components/layout';
 */

export { Sidebar } from './sidebar';
export { Header } from './header';
export { MobileNav } from './mobile-nav';

export type { SidebarProps } from './sidebar';
export type { HeaderProps } from './header';
export type { MobileNavProps } from './mobile-nav';
