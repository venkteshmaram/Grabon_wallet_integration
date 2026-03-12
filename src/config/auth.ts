export const AUTH_CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',

    // Password requirements
    MIN_PASSWORD_LENGTH: 8,

    // OTP expiry
    OTP_EXPIRY_MINUTES: 5,
    MAX_OTP_ATTEMPTS: 3,
} as const
