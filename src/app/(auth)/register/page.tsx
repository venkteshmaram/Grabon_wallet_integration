// ============================================
// REGISTER PAGE - Dark Charcoal + Gold Theme
// Step 2: Auth Pages - Production-grade registration with validation
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// ============================================
// TYPES
// ============================================

interface FormData {
    name: string;
    email: string;
    phone: string;
    password: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    general?: string;
}

// ============================================
// VALIDATION CONSTANTS
// ============================================

const VALIDATION = {
    NAME_MIN_LENGTH: 2,
    PASSWORD_MIN_LENGTH: 8,
    PHONE_REGEX: /^[6-9]\d{9}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateName(name: string): string | undefined {
    if (!name.trim()) {
        return 'Full name is required';
    }
    if (name.trim().length < VALIDATION.NAME_MIN_LENGTH) {
        return `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`;
    }
    return undefined;
}

function validateEmail(email: string): string | undefined {
    if (!email.trim()) {
        return 'Email address is required';
    }
    if (!VALIDATION.EMAIL_REGEX.test(email)) {
        return 'Please enter a valid email address';
    }
    return undefined;
}

function validatePhone(phone: string): string | undefined {
    if (!phone.trim()) {
        return undefined; // Phone is optional
    }
    if (!VALIDATION.PHONE_REGEX.test(phone)) {
        return 'Please enter a valid 10-digit Indian mobile number';
    }
    return undefined;
}

function validatePassword(password: string): string | undefined {
    if (!password) {
        return 'Password is required';
    }
    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }
    if (!/\d/.test(password)) {
        return 'Password must contain at least one number';
    }
    return undefined;
}

// ============================================
// REGISTER PAGE COMPONENT
// ============================================

export default function RegisterPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    // Form state
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    // Clear field error when user types
    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    // ============================================
    // FORM VALIDATION
    // ============================================

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {
            name: validateName(formData.name),
            email: validateEmail(formData.email),
            phone: validatePhone(formData.phone),
            password: validatePassword(formData.password),
        };

        // Remove undefined errors
        Object.keys(newErrors).forEach((key) => {
            if (newErrors[key as keyof FormErrors] === undefined) {
                delete newErrors[key as keyof FormErrors];
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================
    // SUBMIT HANDLER
    // ============================================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim() || undefined,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific error codes
                if (data.error?.code === 'USER_EXISTS') {
                    setErrors({
                        email: 'An account with this email already exists',
                    });
                } else {
                    setErrors({
                        general: data.error?.message || 'Registration failed. Please try again.',
                    });
                }
                return;
            }

            // Success
            setIsSuccess(true);

            // Redirect to login after delay
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch {
            setErrors({
                general: 'Unable to connect. Please check your network and try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================
    // RENDER SUCCESS STATE
    // ============================================

    if (isSuccess) {
        return (
            <div className="w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-[32px] font-bold">
                        <span className="text-[var(--gold)]">Grab</span>
                        <span className="text-[var(--text-primary)]">Cash</span>
                    </h1>
                </div>

                {/* Success Card */}
                <div className="bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-[12px] p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--green-muted)] flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-[var(--green)]" />
                    </div>
                    <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-2">
                        Account Created!
                    </h2>
                    <p className="text-[14px] text-[var(--text-secondary)] mb-4">
                        Your account has been successfully created. Redirecting you to login...
                    </p>
                    <div className="w-full bg-[var(--bg-border)] h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--gold)] animate-[shrink_2s_linear_forwards]" />
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // RENDER REGISTER FORM
    // ============================================

    return (
        <div className="w-full">
            {/* Logo */}
            <div className="text-center mb-8">
                <h1 className="text-[32px] font-bold">
                    <span className="text-[var(--gold)]">Grab</span>
                    <span className="text-[var(--text-primary)]">Cash</span>
                </h1>
                <p className="mt-2 text-[16px] text-[var(--text-secondary)]">
                    Create your account
                </p>
            </div>

            {/* Main Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-[12px] p-8">
                {/* General Error Banner */}
                {errors.general && (
                    <div className="mb-6 p-3 bg-[var(--red-muted)] border border-[var(--red)] border-opacity-30 rounded-lg">
                        <p className="text-sm text-[var(--red)]">{errors.general}</p>
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Input */}
                    <div>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Full Name"
                            disabled={isLoading}
                            className="w-full h-[48px] px-4 bg-[var(--bg-input)] border border-[var(--bg-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-[14px] transition-all duration-150 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {errors.name && (
                            <p className="mt-1 text-[12px] text-[var(--red)]">{errors.name}</p>
                        )}
                    </div>

                    {/* Email Input */}
                    <div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Email address"
                            disabled={isLoading}
                            className="w-full h-[48px] px-4 bg-[var(--bg-input)] border border-[var(--bg-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-[14px] transition-all duration-150 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {errors.email && (
                            <p className="mt-1 text-[12px] text-[var(--red)]">{errors.email}</p>
                        )}
                    </div>

                    {/* Phone Input */}
                    <div>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Phone number (optional)"
                            disabled={isLoading}
                            className="w-full h-[48px] px-4 bg-[var(--bg-input)] border border-[var(--bg-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-[14px] transition-all duration-150 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {errors.phone && (
                            <p className="mt-1 text-[12px] text-[var(--red)]">{errors.phone}</p>
                        )}
                    </div>

                    {/* Password Input */}
                    <div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Password (min 8 characters)"
                            disabled={isLoading}
                            className="w-full h-[48px] px-4 bg-[var(--bg-input)] border border-[var(--bg-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-[14px] transition-all duration-150 focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {errors.password && (
                            <p className="mt-1 text-[12px] text-[var(--red)]">{errors.password}</p>
                        )}
                        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                            Must be at least 8 characters with at least one number
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[48px] bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-[var(--text-inverse)] font-semibold text-[14px] rounded-lg transition-colors duration-150 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>
            </div>

            {/* Login Link */}
            <div className="mt-6 text-center">
                <p className="text-[14px] text-[var(--text-secondary)]">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="text-[var(--gold)] hover:text-[var(--gold-hover)] font-medium transition-colors"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
