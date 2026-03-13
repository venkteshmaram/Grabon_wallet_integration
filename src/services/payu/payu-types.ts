// ============================================
// PAYU SERVICE - TYPESCRIPT TYPES
// Type definitions for PayU payment operations
// ============================================

// ============================================
// PAYU HASH PARAMETERS
// ============================================

/**
 * Parameters required to generate PayU payment hash
 * Amount must be in rupees with 2 decimal places (not paisa)
 */
export interface PayUHashParams {
    /** Unique transaction ID */
    txnId: string;
    /** Amount in rupees as string with 2 decimal places (e.g., "500.00") */
    amount: string;
    /** Product information/description */
    productInfo: string;
    /** Customer first name */
    firstName: string;
    /** Customer email */
    email: string;
    /** User-defined field 1 (typically userId) */
    udf1: string;
    /** User-defined field 2 (typically merchantId) */
    udf2: string;
    /** User-defined field 3 (typically merchantName) */
    udf3: string;
    /** User-defined field 4 (optional) */
    udf4?: string;
    /** User-defined field 5 (optional) */
    udf5?: string;
}

/**
 * Parameters received from PayU in response
 */
export interface PayUResponseParams {
    /** Transaction ID */
    txnid: string;
    /** Payment status from PayU */
    status: 'success' | 'failure' | 'pending';
    /** Amount paid */
    amount: string;
    /** Hash for verification */
    hash: string;
    /** Customer email */
    email: string;
    /** Customer first name */
    firstname: string;
    /** Product info */
    productinfo: string;
    /** Error message if failed */
    error_Message?: string;
    /** Error code if failed */
    error?: string;
    /** Payment mode used */
    mode?: string;
    /** Transaction reference number */
    mihpayid?: string;
    /** Bank reference number */
    bank_ref_num?: string;
    /** UDF fields returned */
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
    /** Additional PayU fields */
    [key: string]: string | undefined;
}

// ============================================
// PAYU FORM PARAMETERS
// ============================================

/**
 * Complete parameters for PayU payment form redirect
 */
export interface PayUFormParams {
    /** PayU merchant key */
    key: string;
    /** Transaction ID */
    txnid: string;
    /** Amount in rupees with 2 decimal places */
    amount: string;
    /** Product information */
    productinfo: string;
    /** Customer first name */
    firstname: string;
    /** Customer email */
    email: string;
    /** Customer phone (required for PayU sandbox) */
    phone?: string;
    /** Success callback URL */
    surl: string;
    /** Failure callback URL */
    furl: string;
    /** SHA512 hash for security */
    hash: string;
    /** User-defined field 1 */
    udf1: string;
    /** User-defined field 2 */
    udf2: string;
    /** User-defined field 3 */
    udf3: string;
    /** User-defined field 4 */
    udf4: string;
    /** User-defined field 5 */
    udf5: string;
    /** Service provider (optional - can cause issues with some accounts) */
    service_provider?: string;
}

// ============================================
// PAYU SERVICE INPUT/OUTPUT
// ============================================

/**
 * Input for initiating a PayU payment
 */
export interface InitiatePaymentInput {
    /** User ID making the payment */
    userId: string;
    /** Amount in paisa (will be converted to rupees for PayU) */
    amountPaisa: number;
    /** Merchant ID where payment is being made */
    merchantId: string;
    /** Merchant name for display */
    merchantName: string;
    /** Product description */
    productInfo?: string;
}

/**
 * Result of payment initiation
 */
export interface PaymentInitiationResult {
    /** Whether fraud check was triggered */
    isFlagged: boolean;
    /** If flagged, the reason */
    flagReason?: string;
    /** Fraud action taken */
    fraudAction?: 'ALLOW' | 'REQUIRE_OTP' | 'BLOCK' | 'FREEZE';
    /** PayU form parameters (only if not flagged) */
    payuParams?: PayUFormParams;
    /** PayU base URL for redirect */
    payuBaseUrl?: string;
    /** Transaction ID for tracking */
    txnId?: string;
    /** Ledger entry ID (if created) */
    ledgerEntryId?: string;
}

/**
 * Result of payment verification
 */
export interface PaymentVerificationResult {
    /** Whether verification succeeded */
    success: boolean;
    /** Transaction ID */
    txnId: string;
    /** Amount in paisa */
    amountPaisa: number;
    /** Status message */
    message: string;
    /** Ledger entry created (if success) */
    ledgerEntryId?: string;
    /** Error code (if failed) */
    errorCode?: string;
}

// ============================================
// TRANSACTION RECORD
// ============================================

/**
 * Pending transaction record for tracking
 */
export interface PendingTransaction {
    /** Transaction ID */
    txnId: string;
    /** User ID */
    userId: string;
    /** Amount in paisa */
    amountPaisa: number;
    /** Merchant ID */
    merchantId: string;
    /** Merchant name */
    merchantName: string;
    /** Ledger entry ID (if created) */
    ledgerEntryId?: string;
    /** Created timestamp */
    createdAt: Date;
    /** Status */
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * PayU-specific error codes
 */
export const PAYU_ERROR_CODES = {
    HASH_VERIFICATION_FAILED: 'HASH_VERIFICATION_FAILED',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    MISSING_CONFIG: 'MISSING_PAYU_CONFIG',
    TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
    DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    FRAUD_BLOCKED: 'FRAUD_BLOCKED',
    PAYU_ERROR: 'PAYU_ERROR',
    WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
} as const;

export type PayuErrorCode = keyof typeof PAYU_ERROR_CODES;

/**
 * Custom error class for PayU operations
 */
export class PayUError extends Error {
    code: string;
    txnId?: string;

    constructor(message: string, code: string, txnId?: string) {
        super(message);
        this.name = 'PayUError';
        this.code = code;
        this.txnId = txnId;
    }
}

// ============================================
// WEBHOOK TYPES
// ============================================

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
    /** Whether processing succeeded */
    success: boolean;
    /** Transaction ID */
    txnId: string;
    /** Status */
    status: 'SUCCESS' | 'FAILURE' | 'PENDING';
    /** Message for logging */
    message: string;
    /** Ledger entry ID (if created) */
    ledgerEntryId?: string;
}

/**
 * Environment configuration for PayU
 */
export interface PayUConfig {
    /** Merchant key */
    key: string;
    /** Merchant salt (secret) */
    salt: string;
    /** Base URL for PayU payments */
    baseUrl: string;
    /** Success callback URL */
    successUrl: string;
    /** Failure callback URL */
    failureUrl: string;
}
