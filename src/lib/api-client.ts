// ============================================
// API CLIENT - Axios Instance with Auth Interceptor
// Step 2: Auth Pages - Production-grade API communication
// ============================================

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth-store';

// ============================================
// ERROR TYPES
// ============================================

interface ApiError {
    message: string;
    code: string;
}

interface ApiErrorResponse {
    error: ApiError;
}

// ============================================
// AXIOS INSTANCE CONFIGURATION
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';
const REQUEST_TIMEOUT = 15000; // 15 seconds

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

apiClient.interceptors.request.use(
    (config) => {
        // Get token from auth store
        const token = useAuthStore.getState().token;

        // Add Authorization header if token exists
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ============================================
// RESPONSE INTERCEPTOR - ERROR HANDLING
// ============================================

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
        // Handle 401 - Unauthorized
        if (error.response?.status === 401) {
            const errorCode = error.response.data?.error?.code;

            // Check if it's a token expiration issue
            if (errorCode === 'TOKEN_EXPIRED') {
                console.warn('[API] Token expired, attempting refresh...');

                try {
                    // Attempt to refresh the token
                    const refreshResponse = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': String(error.config?.headers?.Authorization || ''),
                        },
                    });

                    if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        if (refreshData.data?.token) {
                            // Update token in auth store
                            useAuthStore.setState({ token: refreshData.data.token });

                            // Retry the original request with new token
                            if (error.config) {
                                error.config.headers.Authorization = `Bearer ${refreshData.data.token}`;
                                return apiClient.request(error.config);
                            }
                        }
                    }
                } catch (refreshError) {
                    console.error('[API] Token refresh failed:', refreshError);
                }
            }

            // If refresh failed or not a token expiry, clear auth and redirect
            console.warn('[API] Authentication failed, logging out...');
            useAuthStore.getState().logout();
            return Promise.reject(error);
        }

        // Extract error details
        let apiError: ApiError;

        if (error.response?.data?.error) {
            // Use error from response
            apiError = error.response.data.error;
        } else if (error.response) {
            // Generic HTTP error
            apiError = {
                message: `Request failed with status ${error.response.status}`,
                code: `HTTP_${error.response.status}`,
            };
        } else if (error.request) {
            // Network error
            apiError = {
                message: 'Unable to connect. Please check your network connection.',
                code: 'NETWORK_ERROR',
            };
        } else {
            // Unknown error
            apiError = {
                message: 'An unexpected error occurred',
                code: 'UNKNOWN_ERROR',
            };
        }

        // Return standardized error
        return Promise.reject(apiError);
    }
);

// ============================================
// TYPED API FUNCTIONS
// ============================================

/**
 * GET request wrapper with type safety
 */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
}

/**
 * POST request wrapper with type safety
 */
export async function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
}

/**
 * PUT request wrapper with type safety
 */
export async function apiPut<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
}

/**
 * PATCH request wrapper with type safety
 */
export async function apiPatch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
}

/**
 * DELETE request wrapper with type safety
 */
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
}

// ============================================
// EXPORT
// ============================================

export { apiClient };
export type { ApiError };
