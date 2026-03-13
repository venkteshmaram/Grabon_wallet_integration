import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Custom GrabCash colors
                background: 'var(--bg-primary)',
                foreground: 'var(--text-primary)',
                card: {
                    DEFAULT: 'var(--bg-card)',
                    foreground: 'var(--text-primary)',
                },
                popover: {
                    DEFAULT: 'var(--bg-card)',
                    foreground: 'var(--text-primary)',
                },
                primary: {
                    DEFAULT: 'var(--gold)',
                    foreground: 'var(--text-inverse)',
                    hover: 'var(--gold-hover)',
                },
                secondary: {
                    DEFAULT: 'var(--bg-hover)',
                    foreground: 'var(--text-primary)',
                },
                muted: {
                    DEFAULT: 'var(--bg-border)',
                    foreground: 'var(--text-secondary)',
                },
                accent: {
                    DEFAULT: 'var(--gold-muted)',
                    foreground: 'var(--gold)',
                },
                destructive: {
                    DEFAULT: 'var(--red)',
                    foreground: 'var(--text-primary)',
                },
                border: 'var(--bg-border)',
                input: 'var(--bg-input)',
                ring: 'var(--gold)',
                // Semantic colors
                gold: {
                    DEFAULT: 'var(--gold)',
                    hover: 'var(--gold-hover)',
                    muted: 'var(--gold-muted)',
                    subtle: 'var(--gold-subtle)',
                    border: 'var(--gold-border)',
                },
                success: {
                    DEFAULT: 'var(--green)',
                    muted: 'var(--green-muted)',
                },
                info: {
                    DEFAULT: 'var(--blue)',
                    muted: 'var(--blue-muted)',
                },
                warning: {
                    DEFAULT: 'var(--orange)',
                    muted: 'var(--orange-muted)',
                },
                error: {
                    DEFAULT: 'var(--red)',
                    muted: 'var(--red-muted)',
                },
            },
            borderRadius: {
                lg: 'var(--radius-lg)',
                md: 'var(--radius-md)',
                sm: 'var(--radius-sm)',
                xl: 'var(--radius-xl)',
                full: 'var(--radius-full)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                display: ['var(--font-display)', 'system-ui', 'sans-serif'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            width: {
                sidebar: 'var(--sidebar-width)',
                'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
            },
            height: {
                header: 'var(--header-height)',
                'mobile-nav': 'var(--mobile-nav-height)',
            },
            boxShadow: {
                gold: 'var(--shadow-gold)',
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },
            transitionDuration: {
                fast: '150ms',
                normal: '250ms',
                slow: '350ms',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'pulse-gold': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(163, 230, 53, 0.4)' },
                    '50%': { boxShadow: '0 0 0 8px rgba(163, 230, 53, 0)' },
                },
                spin: {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'fade-in-up': {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in-left': {
                    from: { opacity: '0', transform: 'translateX(-20px)' },
                    to: { opacity: '1', transform: 'translateX(0)' },
                },
                'slide-in-right': {
                    from: { opacity: '0', transform: 'translateX(20px)' },
                    to: { opacity: '1', transform: 'translateX(0)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                },
                'scale-in': {
                    from: { opacity: '0', transform: 'scale(0.95)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                shimmer: 'shimmer 1.5s infinite',
                'pulse-gold': 'pulse-gold 2s infinite',
                spin: 'spin 1s linear infinite',
                'fade-in': 'fade-in 250ms ease forwards',
                'fade-in-up': 'fade-in-up 250ms ease forwards',
                'slide-in-left': 'slide-in-left 250ms ease forwards',
                'slide-in-right': 'slide-in-right 250ms ease forwards',
                shake: 'shake 0.5s ease-in-out',
                'scale-in': 'scale-in 250ms ease forwards',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

export default config;
