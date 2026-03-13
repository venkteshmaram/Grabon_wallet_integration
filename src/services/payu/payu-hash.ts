// ============================================
// PAYU HASH SERVICE - SHA512 Hash Generation & Verification
// Critical security module - hash construction is exact and unforgiving
// ============================================

import { createHash } from 'crypto';
import {
    PayUHashParams,
    PayUResponseParams,
    PayUFormParams,
    PayUError,
    PAYU_ERROR_CODES,
} from './payu-types';

// ============================================
// CONFIGURATION ACCESS
// ============================================

/**
 * Gets PayU key from environment
 * NEVER returns hardcoded values - fails fast if not configured
 */
function getPayUKey(): string {
    const key = process.env.PAYU_KEY;
    if (!key) {
        throw new PayUError(
            'PAYU_KEY not configured in environment',
            PAYU_ERROR_CODES.MISSING_CONFIG
        );
    }
    return key;
}

/**
 * Gets PayU salt from environment
 * NEVER returns hardcoded values - fails fast if not configured
 * NEVER logs this value anywhere
 */
function getPayUSalt(): string {
    const salt = process.env.PAYU_SALT;
    if (!salt) {
        throw new PayUError(
            'PAYU_SALT not configured in environment',
            PAYU_ERROR_CODES.MISSING_CONFIG
        );
    }
    return salt;
}

// ============================================
// HASH GENERATION
// ============================================

/**
 * Generates SHA512 hash for PayU payment initiation
 *
 * Hash string format (pipe-separated):
 * key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
 *
 * The amount must be formatted as a decimal string with exactly 2 decimal places.
 * Empty UDF fields must be included as empty strings between pipes.
 *
 * @param params - Hash parameters
 * @returns Hex digest of SHA512 hash
 * @throws PayUError if configuration is missing
 */
export function generatePayUHash(params: PayUHashParams): string {
    const key = getPayUKey();
    const salt = getPayUSalt();

    // Build hash string in exact order required by PayU
    const hashString = buildHashString(params, key, salt);

    // Compute SHA512 hash
    return computeSHA512(hashString);
}

/**
 * Builds the hash string in exact PayU format
 * Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
 */
function buildHashString(
    params: PayUHashParams,
    key: string,
    salt: string
): string {
    const {
        txnId,
        amount,
        productInfo,
        firstName,
        email,
        udf1 = '',
        udf2 = '',
        udf3 = '',
        udf4 = '',
        udf5 = '',
    } = params;

    // Build in exact order - every pipe matters
    const parts = [
        key,
        txnId,
        amount,
        productInfo,
        firstName,
        email,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        '', // Empty field 1
        '', // Empty field 2
        '', // Empty field 3
        '', // Empty field 4
        '', // Empty field 5
        salt,
    ];

    return parts.join('|');
}

/**
 * Computes SHA512 hash of a string
 */
function computeSHA512(input: string): string {
    return createHash('sha512').update(input).digest('hex');
}

// ============================================
// HASH VERIFICATION
// ============================================

/**
 * Verifies PayU's response hash to confirm payment result authenticity
 *
 * Reverse hash string format:
 * salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 *
 * If the computed hash doesn't match the response hash, the response must be
 * rejected - never trust PayU's success status without verification.
 *
 * @param responseParams - Parameters received from PayU
 * @returns true if hash is valid, false otherwise
 * @throws PayUError if configuration is missing
 */
export function verifyPayUResponseHash(responseParams: PayUResponseParams): boolean {
    try {
        const salt = getPayUSalt();
        const key = getPayUKey();

        // Build reverse hash string
        const reverseHashString = buildReverseHashString(responseParams, salt, key);

        // Compute expected hash
        const computedHash = computeSHA512(reverseHashString);

        // Compare with received hash (case-insensitive)
        const receivedHash = responseParams.hash.toLowerCase();
        const expectedHash = computedHash.toLowerCase();

        return receivedHash === expectedHash;
    } catch (error) {
        // If we can't verify, consider it invalid
        return false;
    }
}

/**
 * Builds the reverse hash string for verification
 * Format: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
function buildReverseHashString(
    params: PayUResponseParams,
    salt: string,
    key: string
): string {
    const {
        status,
        amount,
        txnid,
        email,
        firstname,
        productinfo,
        udf1 = '',
        udf2 = '',
        udf3 = '',
        udf4 = '',
        udf5 = '',
    } = params;

    // Build in exact reverse order
    const parts = [
        salt,
        status,
        '', // Empty field 1
        '', // Empty field 2
        '', // Empty field 3
        '', // Empty field 4
        '', // Empty field 5
        udf5,
        udf4,
        udf3,
        udf2,
        udf1,
        email,
        firstname,
        productinfo,
        amount,
        txnid,
        key,
    ];

    return parts.join('|');
}

// ============================================
// FORM PARAMETER BUILDING
// ============================================

/**
 * Assembles complete PayU form parameters for redirect
 *
 * This function:
 * 1. Converts amount from paisa to rupees with 2 decimal places
 * 2. Sets success/failure URLs from environment
 * 3. Generates the security hash
 * 4. Returns complete params object ready for frontend redirect
 *
 * @param userId - User making the payment
 * @param amountPaisa - Amount in paisa (integer)
 * @param txnId - Unique transaction ID
 * @param productInfo - Product description
 * @param userEmail - Customer email
 * @param userName - Customer name
 * @param merchantId - Merchant ID (stored in udf2)
 * @param merchantName - Merchant name (stored in udf3)
 * @param userPhone - User phone number (required for PayU sandbox)
 * @returns Complete PayU form parameters
 * @throws PayUError if configuration is missing or invalid
 */
export function buildPayUFormParams(
    userId: string,
    amountPaisa: number,
    txnId: string,
    productInfo: string,
    userEmail: string,
    userName: string,
    merchantId: string,
    merchantName: string,
    appliedBalancePaisa: number,
    userPhone?: string
): PayUFormParams {
    // Validate and get configuration
    const key = getPayUKey();
    const surl = getSuccessUrl();
    const furl = getFailureUrl();

    // Convert paisa to rupees with exactly 2 decimal places
    const amountRupees = (amountPaisa / 100).toFixed(2);

    // Build hash parameters
    const hashParams: PayUHashParams = {
        txnId,
        amount: amountRupees,
        productInfo,
        firstName: userName,
        email: userEmail,
        udf1: userId,
        udf2: merchantId,
        udf3: merchantName,
        udf4: appliedBalancePaisa.toString(),
        udf5: '',
    };

    // Generate hash
    const hash = generatePayUHash(hashParams);

    // Build and return complete form params
    return {
        key,
        txnid: txnId,
        amount: amountRupees,
        productinfo: productInfo,
        firstname: userName,
        email: userEmail,
        phone: userPhone || '9999999999', // Required for PayU sandbox
        surl,
        furl,
        hash,
        udf1: userId,
        udf2: merchantId,
        udf3: merchantName,
        udf4: appliedBalancePaisa.toString(),
        udf5: '',
        // Note: service_provider removed - can cause issues with some PayU accounts
    };
}

/**
 * Gets success URL from environment
 */
function getSuccessUrl(): string {
    const url = process.env.PAYU_SUCCESS_URL;
    if (!url) {
        throw new PayUError(
            'PAYU_SUCCESS_URL not configured in environment',
            PAYU_ERROR_CODES.MISSING_CONFIG
        );
    }
    return url;
}

/**
 * Gets failure URL from environment
 */
function getFailureUrl(): string {
    const url = process.env.PAYU_FAILURE_URL;
    if (!url) {
        throw new PayUError(
            'PAYU_FAILURE_URL not configured in environment',
            PAYU_ERROR_CODES.MISSING_CONFIG
        );
    }
    return url;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validates that amount is a valid integer in paisa
 */
export function validateAmountPaisa(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new PayUError(
            `Invalid amount: ${amount}. Must be a positive integer in paisa.`,
            PAYU_ERROR_CODES.INVALID_AMOUNT
        );
    }
}

/**
 * Gets PayU base URL from environment
 */
export function getPayUBaseUrl(): string {
    const url = process.env.PAYU_BASE_URL;
    if (!url) {
        throw new PayUError(
            'PAYU_BASE_URL not configured in environment',
            PAYU_ERROR_CODES.MISSING_CONFIG
        );
    }
    return url;
}

/**
 * Generates a unique transaction ID using UUID v4 format
 * Removes hyphens for PayU compatibility
 */
export function generateTransactionId(): string {
    return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Converts paisa to rupees string with 2 decimal places
 * Used when amount needs to be displayed or sent to PayU
 */
export function paisaToRupeesString(paisa: number): string {
    return (paisa / 100).toFixed(2);
}

/**
 * Parses amount from PayU response (rupees string) to paisa integer
 * Returns -1 if parsing fails
 */
export function parsePayUAmountToPaisa(amountStr: string): number {
    const rupees = parseFloat(amountStr);
    if (isNaN(rupees) || rupees < 0) {
        return -1;
    }
    return Math.round(rupees * 100);
}
