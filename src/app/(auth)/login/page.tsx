// ============================================
// LOGIN PAGE - Dark Charcoal + Gold Theme
// Step 2 & 3: Auth + Wallet Stores
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check as LucideCheck, Loader2, Wallet } from 'lucide-react';
import { useAuthStore, PERSONAS } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// Expose wallet store to window for DevTools debugging
if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).useWalletStore = useWalletStore;
    console.log('[Dev] useWalletStore exposed to window');
}

// ============================================
// TYPES
// ============================================

interface LoadingState {
    manual: boolean;
    personaId: string | null;
}

// ============================================
// LOGIN PAGE COMPONENT
// ============================================

export default function LoginPage() {
    const router = useRouter();
    const { login, loginAsPersona, isAuthenticated, error, clearError } = useAuthStore();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState<LoadingState>({
        manual: false,
        personaId: null,
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    // Clear errors when inputs change
    useEffect(() => {
        if (formError) setFormError('');
        if (error) clearError();
    }, [email, password, formError, error, clearError]);

    // ============================================
    // MANUAL LOGIN HANDLER
    // ============================================

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        clearError();

        // Client-side validation
        if (!email.trim()) {
            setFormError('Please enter your email address');
            return;
        }

        if (!password.trim()) {
            setFormError('Please enter your password');
            return;
        }

        setLoading((prev) => ({ ...prev, manual: true }));

        try {
            const result = await login(email, password);

            if (result.success) {
                window.location.href = '/dashboard';
            } else {
                setFormError(result.error || 'Invalid email or password');
            }
        } catch {
            setFormError('Unable to connect. Please try again.');
        } finally {
            setLoading((prev) => ({ ...prev, manual: false }));
        }
    };

    // ============================================
    // PERSONA QUICK LOGIN HANDLER
    // ============================================

    const handlePersonaLogin = async (personaEmail: string, personaId: string) => {
        setFormError('');
        clearError();
        setLoading({ manual: false, personaId });

        try {
            const result = await loginAsPersona(personaEmail);

            if (result.success) {
                window.location.href = '/dashboard';
            } else {
                setFormError(result.error || 'Login failed');
                setLoading({ manual: false, personaId: null });
            }
        } catch {
            setFormError('Unable to connect. Please try again.');
            setLoading({ manual: false, personaId: null });
        }
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="w-full animate-fade-in-up">
            {/* Logo and Tagline */}
            <div className="flex flex-col items-center mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold shadow-[0_0_20px_rgba(163,230,53,0.3)] transform transition-transform hover:scale-105 active:scale-95">
                        <Wallet className="w-6 h-6 text-background" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">
                        <span className="text-gold shadow-gold-sm">Grab</span>
                        <span className="text-foreground">Cash</span>
                    </h1>
                </div>
                <p className="text-[var(--text-secondary)] text-sm font-medium tracking-wide">
                    Your cashback. <span className="text-gold">Invested.</span>
                </p>
            </div>

            {/* Main Card */}
            <Card className="border-zinc-800/50 bg-[rgba(15,15,15,0.7)] backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-6 sm:p-10">
                    {/* Error Banner */}
                    {(formError || error) && (
                        <div className="mb-6 p-3 bg-red-muted border border-red/30 rounded-lg">
                            <p className="text-sm text-red">
                                {formError || error}
                            </p>
                        </div>
                    )}

                    {/* Manual Login Form */}
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        {/* Email Input */}
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            disabled={loading.manual || !!loading.personaId}
                        />

                        {/* Password Input */}
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            disabled={loading.manual || !!loading.personaId}
                        />

                        {/* Sign In Button */}
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            isLoading={loading.manual}
                            disabled={loading.manual || !!loading.personaId}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-card text-muted-foreground text-xs">
                                Quick Demo Login
                            </span>
                        </div>
                    </div>

                    {/* Persona Quick Login Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        {PERSONAS.map((persona) => (
                            <button
                                type="button"
                                key={persona.id}
                                onClick={() => handlePersonaLogin(persona.email, persona.id)}
                                disabled={loading.manual || !!loading.personaId}
                                className="group relative flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50 transition-all duration-300 hover:border-gold/50 hover:bg-zinc-800/60 hover:shadow-[0_0_20px_rgba(163,230,53,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="w-8 h-8 shrink-0 rounded-full bg-gold flex items-center justify-center text-background text-xs font-black shadow-[0_0_10px_rgba(163,230,53,0.3)]">
                                    {loading.personaId === persona.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        persona.initials
                                    )}
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-[12px] font-bold text-white tracking-tight truncate w-full">
                                        {persona.name.split(' ')[0]}
                                    </span>
                                    <span className="text-[9px] font-bold text-gold uppercase tracking-tighter opacity-80 truncate w-full">
                                        {persona.role}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Register Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link
                        href="/register"
                        className="text-gold hover:text-gold-hover font-medium transition-colors"
                    >
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
