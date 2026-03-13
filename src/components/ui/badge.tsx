import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    const variants = {
        default: 'border-transparent bg-gold text-background hover:bg-gold-hover',
        secondary: 'border-transparent bg-secondary text-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-red text-white hover:bg-red/80',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-green-muted text-green hover:bg-green-muted/80',
        warning: 'border-transparent bg-orange-muted text-orange hover:bg-orange-muted/80',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2',
                variants[variant],
                className
            )}
            {...props}
        />
    );
}

export { Badge };
