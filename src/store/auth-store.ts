// ============================================
// AUTH STORE - Zustand Authentication State Management
// Step 2 & 3: Auth + Wallet Integration
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWalletStore } from './wallet-store';

// ============================================
// TYPES
// ============================================

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

interface AuthState {
    // State
    token: string | null;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginAsPersona: (email: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    clearError: () => void;
    getAuthHeader: () => { Authorization?: string };
}

interface LoginResponse {
    data: {
        user: User;
        token: string;
    };
}

interface ErrorResponse {
    error: {
        message: string;
        code: string;
    };
}

// ============================================
// PERSONA CONFIGURATION
// ============================================

export const PERSONAS = [
    {
        id: 'priya',
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        role: 'Power User',
        initials: 'PS',
    },
    {
        id: 'arjun',
        name: 'Arjun Mehta',
        email: 'arjun.mehta@email.com',
        role: 'New User',
        initials: 'AM',
    },
    {
        id: 'meera',
        name: 'Meera Nair',
        email: 'meera.nair@email.com',
        role: 'Traveler',
        initials: 'MN',
    },
    {
        id: 'rajan',
        name: 'Rajan Kumar',
        email: 'rajan.kumar@email.com',
        role: 'Saver',
        initials: 'RK',
    },
    {
        id: 'vikram',
        name: 'Vikram Singh',
        email: 'vikram.singh@email.com',
        role: 'Fraud Case',
        initials: 'VS',
    },
] as const;

const DEFAULT_PASSWORD = 'password123';

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial State
            token: null,
            userId: null,
            userName: null,
            userEmail: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // ============================================
            // LOGIN ACTION
            // ============================================
            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const data = await response.json() as LoginResponse | ErrorResponse;

                    if (!response.ok) {
                        const errorMessage = 'error' in data
                            ? data.error.message
                            : 'Login failed';

                        set({
                            error: errorMessage,
                            isLoading: false,
                            isAuthenticated: false,
                        });

                        return { success: false, error: errorMessage };
                    }

                    // Type guard for successful response
                    if ('data' in data && data.data && 'user' in data.data && 'token' in data.data) {
                        set({
                            token: data.data.token,
                            userId: data.data.user.id,
                            userName: data.data.user.name,
                            userEmail: data.data.user.email,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });

                        return { success: true };
                    }

                    throw new Error('Invalid response format');
                } catch (err) {
                    const errorMessage = err instanceof Error
                        ? err.message
                        : 'Unable to connect. Please try again.';

                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                    });

                    return { success: false, error: errorMessage };
                }
            },

            // ============================================
            // LOGIN AS PERSONA (Quick Login)
            // ============================================
            loginAsPersona: async (email: string) => {
                // Clear existing wallet data first to prevent flashing old data
                useWalletStore.getState().clearStore();
                return get().login(email, DEFAULT_PASSWORD);
            },

            // ============================================
            // LOGOUT ACTION
            // ============================================
            logout: () => {
                // Clear auth state
                set({
                    token: null,
                    userId: null,
                    userName: null,
                    userEmail: null,
                    isAuthenticated: false,
                    error: null,
                });

                // Clear wallet store
                useWalletStore.getState().clearStore();

                // Hard redirect to clear all state
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            },

            // ============================================
            // CLEAR ERROR
            // ============================================
            clearError: () => {
                set({ error: null });
            },

            // ============================================
            // GET AUTH HEADER
            // ============================================
            getAuthHeader: () => {
                const { token } = get();
                return token ? { Authorization: `Bearer ${token}` } : {};
            },
        }),
        {
            name: 'grabcash-auth',
            partialize: (state) => ({
                token: state.token,
                userId: state.userId,
                userName: state.userName,
                userEmail: state.userEmail,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
