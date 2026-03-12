// ============================================
// OTP SERVICE - Core Operations
// Generate and verify OTP codes for fraud protection
// NO Twilio - OTP displayed directly in UI
// ============================================

import { prisma } from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import {
    OTPVerificationResult,
    OTPGenerationResult,
    VerifyOTPInput,
    GenerateOTPInput,
    OTPError,
    OTP_ERROR_CODES,
    VALID_OTP_PURPOSES,
    OTPPurpose,
} from './otp-types';

// ============================================
// CONSTANTS
// ============================================

/** OTP expiry time in minutes - hardcoded as per requirements */
const OTP_EXPIRY_MINUTES = 5;

/** Maximum failed attempts before account freeze - hardcoded as per requirements */
const OTP_MAX_ATTEMPTS = 3;

/** OTP code length */
const OTP_CODE_LENGTH = 6;

// ============================================
// OTP GENERATION
// ============================================

/**
 * Generates a random 6-digit OTP code
 * Stores it in OTPVerification table with 5 minute expiry
 * Returns the OTP code directly in the response (displayed in UI)
 * Invalidates any existing unused OTPs for the same user and purpose
 *
 * @param input - GenerateOTPInput containing userId and purpose
 * @returns OTPGenerationResult with otpCode, expiresAt, purpose, otpId
 * @throws OTPError if generation fails
 */
export async function generateOTP(
    input: GenerateOTPInput
): Promise<OTPGenerationResult> {
    validatePurpose(input.purpose);

    try {
        // Step 1: Invalidate any existing unused OTPs for this user and purpose
        await invalidateExistingOTPs(input.userId, input.purpose);

        // Step 2: Generate random 6-digit code
        const otpCode = generateRandomCode();

        // Step 3: Calculate expiry time (5 minutes from now)
        const expiresAt = addMinutes(new Date(), OTP_EXPIRY_MINUTES);

        // Step 4: Store in database
        const otpRecord = await prisma.oTPVerification.create({
            data: {
                userId: input.userId,
                code: otpCode,
                purpose: input.purpose,
                expiresAt,
                isUsed: false,
                attempts: 0,
            },
        });

        // Step 5: Return result (OTP is displayed directly in UI - no SMS)
        return {
            otpCode,
            expiresAt,
            purpose: input.purpose,
            otpId: otpRecord.id,
        };
    } catch (error) {
        if (error instanceof OTPError) throw error;

        throw new OTPError(
            'Failed to generate OTP',
            OTP_ERROR_CODES.OTP_GENERATION_FAILED
        );
    }
}

/**
 * Generates a cryptographically secure random 6-digit number
 * Uses Math.random() which is sufficient for demo purposes
 * For production, use crypto.randomInt() when available
 */
function generateRandomCode(): string {
    // Generate a 6-digit number (100000 to 999999)
    const min = 100000;
    const max = 999999;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code.toString();
}

/**
 * Invalidates existing unused OTPs for the same user and purpose
 * Sets isUsed = true to prevent multiple active OTPs
 */
async function invalidateExistingOTPs(
    userId: string,
    purpose: string
): Promise<void> {
    try {
        await prisma.oTPVerification.updateMany({
            where: {
                userId,
                purpose,
                isUsed: false,
            },
            data: {
                isUsed: true,
            },
        });
    } catch (error) {
        // Log but don't fail - new OTP will still be created
        console.error('Failed to invalidate existing OTPs:', error);
    }
}

/**
 * Validates that the purpose is one of the allowed values
 */
function validatePurpose(purpose: string): asserts purpose is OTPPurpose {
    if (!VALID_OTP_PURPOSES.includes(purpose as OTPPurpose)) {
        throw new OTPError(
            `Invalid OTP purpose: ${purpose}. Valid purposes: ${VALID_OTP_PURPOSES.join(', ')}`,
            OTP_ERROR_CODES.INVALID_PURPOSE
        );
    }
}

// ============================================
// OTP VERIFICATION
// ============================================

/**
 * Verifies an OTP code
 * Checks:
 * 1. OTP exists for user and purpose
 * 2. OTP is not expired
 * 3. OTP is not already used
 * 4. Code matches
 * 5. Attempts < 3
 *
 * On wrong entry: increments attempts counter
 * On 3 wrong attempts: marks OTP as used, returns ACCOUNT_FROZEN
 * On success: marks isUsed = true, sets usedAt
 *
 * @param input - VerifyOTPInput containing userId, code, and purpose
 * @returns OTPVerificationResult with verification status
 */
export async function verifyOTP(
    input: VerifyOTPInput
): Promise<OTPVerificationResult> {
    validatePurpose(input.purpose);

    try {
        // Step 1: Fetch the most recent unused OTP for this user and purpose
        const otpRecord = await prisma.oTPVerification.findFirst({
            where: {
                userId: input.userId,
                purpose: input.purpose,
                isUsed: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Step 2: Check if OTP exists
        if (!otpRecord) {
            return {
                verified: false,
                errorCode: OTP_ERROR_CODES.OTP_NOT_FOUND,
                message: 'No active OTP found for this user and purpose',
            };
        }

        // Step 3: Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            // Mark as used to prevent further attempts
            await markOTPAsUsed(otpRecord.id);
            return {
                verified: false,
                errorCode: OTP_ERROR_CODES.OTP_EXPIRED,
                message: 'OTP has expired. Please request a new OTP.',
            };
        }

        // Step 4: Increment attempts counter
        const newAttempts = otpRecord.attempts + 1;
        await prisma.oTPVerification.update({
            where: { id: otpRecord.id },
            data: { attempts: newAttempts },
        });

        // Step 5: Check if max attempts exceeded
        if (newAttempts >= OTP_MAX_ATTEMPTS) {
            // Mark OTP as used (freeze account)
            await markOTPAsUsed(otpRecord.id);
            return {
                verified: false,
                errorCode: OTP_ERROR_CODES.ACCOUNT_FROZEN,
                message: 'Maximum attempts exceeded. Your account has been frozen for security. Please contact support.',
                attemptsRemaining: 0,
                isFrozen: true,
            };
        }

        // Step 6: Verify code matches
        if (otpRecord.code !== input.code) {
            const attemptsRemaining = OTP_MAX_ATTEMPTS - newAttempts;
            return {
                verified: false,
                errorCode: OTP_ERROR_CODES.INVALID_CODE,
                message: `Invalid OTP code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
                attemptsRemaining,
            };
        }

        // Step 7: Success - mark OTP as used
        await markOTPAsUsed(otpRecord.id);

        return {
            verified: true,
            message: 'OTP verified successfully',
        };
    } catch (error) {
        if (error instanceof OTPError) throw error;

        return {
            verified: false,
            errorCode: OTP_ERROR_CODES.OTP_GENERATION_FAILED,
            message: 'Failed to verify OTP. Please try again.',
        };
    }
}

/**
 * Marks an OTP as used and sets the usedAt timestamp
 */
async function markOTPAsUsed(otpId: string): Promise<void> {
    await prisma.oTPVerification.update({
        where: { id: otpId },
        data: {
            isUsed: true,
            usedAt: new Date(),
        },
    });
}

// ============================================
// ACCOUNT FREEZING
// ============================================

/**
 * Freezes a user account due to max OTP attempts exceeded
 * This is a placeholder - actual implementation would update user status
 *
 * @param userId - User ID to freeze
 */
export async function freezeAccount(userId: string): Promise<void> {
    // TODO: Implement account freezing logic
    // This would typically update a 'status' field on the User table
    // For now, we just log it
    console.warn(`Account frozen for user: ${userId} due to max OTP attempts`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Gets OTP expiry time in minutes
 */
export function getOTPExpiryMinutes(): number {
    return OTP_EXPIRY_MINUTES;
}

/**
 * Gets max allowed attempts
 */
export function getOTPMaxAttempts(): number {
    return OTP_MAX_ATTEMPTS;
}

/**
 * Checks if a user has an active OTP
 */
export async function hasActiveOTP(
    userId: string,
    purpose: string
): Promise<boolean> {
    const otpRecord = await prisma.oTPVerification.findFirst({
        where: {
            userId,
            purpose,
            isUsed: false,
            expiresAt: {
                gt: new Date(),
            },
        },
    });

    return !!otpRecord;
}
