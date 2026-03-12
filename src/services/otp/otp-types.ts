// ============================================
// OTP SERVICE - TYPESCRIPT TYPES
// Type definitions for OTP operations
// ============================================

// ============================================
// OTP VERIFICATION RESULT
// ============================================

export interface OTPVerificationResult {
    /** Whether OTP was verified successfully */
    verified: boolean;
    /** Error code if verification failed */
    errorCode?: OTPErrorCode;
    /** Human readable message */
    message: string;
    /** Number of attempts remaining (only on failed verification) */
    attemptsRemaining?: number;
    /** Whether account is frozen due to max attempts */
    isFrozen?: boolean;
}

// ============================================
// OTP GENERATION RESULT
// ============================================

export interface OTPGenerationResult {
    /** The 6-digit OTP code */
    otpCode: string;
    /** When the OTP expires */
    expiresAt: Date;
    /** Purpose of the OTP */
    purpose: string;
    /** OTP record ID */
    otpId: string;
}

// ============================================
// OTP ERROR CODES
// ============================================

export const OTP_ERROR_CODES = {
    OTP_NOT_FOUND: 'OTP_NOT_FOUND',
    OTP_EXPIRED: 'OTP_EXPIRED',
    OTP_ALREADY_USED: 'OTP_ALREADY_USED',
    INVALID_CODE: 'INVALID_CODE',
    MAX_ATTEMPTS_EXCEEDED: 'MAX_ATTEMPTS_EXCEEDED',
    ACCOUNT_FROZEN: 'ACCOUNT_FROZEN',
    OTP_GENERATION_FAILED: 'OTP_GENERATION_FAILED',
    INVALID_PURPOSE: 'INVALID_PURPOSE',
} as const;

export type OTPErrorCode = keyof typeof OTP_ERROR_CODES;

// ============================================
// OTP ERROR CLASS
// ============================================

export class OTPError extends Error {
    code: OTPErrorCode;
    userId?: string;

    constructor(message: string, code: OTPErrorCode, userId?: string) {
        super(message);
        this.name = 'OTPError';
        this.code = code;
        this.userId = userId;
    }
}

// ============================================
// OTP PURPOSE TYPES
// ============================================

export type OTPPurpose =
    | 'FRAUD_VERIFICATION'
    | 'TRANSACTION_CONFIRMATION'
    | 'ACCOUNT_RECOVERY'
    | 'HIGH_VALUE_TRANSACTION';

// ============================================
// VALID OTP PURPOSES
// ============================================

export const VALID_OTP_PURPOSES: OTPPurpose[] = [
    'FRAUD_VERIFICATION',
    'TRANSACTION_CONFIRMATION',
    'ACCOUNT_RECOVERY',
    'HIGH_VALUE_TRANSACTION',
];

// ============================================
// OTP VALIDATION INPUT
// ============================================

export interface VerifyOTPInput {
    /** User ID */
    userId: string;
    /** The 6-digit OTP code entered by user */
    code: string;
    /** Purpose of the OTP */
    purpose: OTPPurpose;
}

// ============================================
// OTP GENERATION INPUT
// ============================================

export interface GenerateOTPInput {
    /** User ID */
    userId: string;
    /** Purpose of the OTP */
    purpose: OTPPurpose;
}

// ============================================
// OTP RECORD (from database)
// ============================================

export interface OTPRecord {
    id: string;
    userId: string;
    code: string;
    purpose: string;
    expiresAt: Date;
    isUsed: boolean;
    usedAt?: Date;
    attempts: number;
    createdAt: Date;
}
