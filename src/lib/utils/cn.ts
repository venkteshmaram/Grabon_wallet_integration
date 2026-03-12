/**
 * Utility for merging Tailwind CSS classes with proper precedence
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 * 
 * @example
 * cn('btn', isActive && 'btn-active', className)
 * // => 'btn btn-active custom-class'
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class values into a single string
 * - Handles conditional classes (falsy values are filtered out)
 * - Resolves Tailwind class conflicts (last one wins)
 * - Preserves custom class names
 * 
 * @param inputs - Class values to merge (strings, objects, arrays, or falsy values)
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/**
 * Creates a variant-based className generator
 * Useful for components with multiple visual variants
 * 
 * @example
 * const buttonVariants = cva('btn', {
 *   variants: {
 *     variant: {
 *       primary: 'btn-primary',
 *       secondary: 'btn-secondary',
 *     },
 *     size: {
 *       sm: 'btn-sm',
 *       lg: 'btn-lg',
 *     },
 *   },
 *   defaultVariants: {
 *     variant: 'primary',
 *     size: 'sm',
 *   },
 * });
 */
export { cva } from 'class-variance-authority';
export type { VariantProps } from 'class-variance-authority';
