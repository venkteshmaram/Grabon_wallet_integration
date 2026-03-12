// ============================================
// OTP SERVICE - PUBLIC API
// Export all OTP operations
// ============================================

// Types
export type {
    OTPVerificationResult,
    OTPGenerationResult,
    VerifyOTPInput,
    GenerateOTPInput,
    OTPErrorCode,
    OTPPurpose,
    OTPRecord,
} from './otp-types';

// Constants and Classes
export {
    OTP_ERROR_CODES,
    VALID_OTP_PURPOSES,
    OTPError,
} from './otp-types';

// Service functions
export {
    generateOTP,
    verifyOTP,
    freezeAccount,
    getOTPExpiryMinutes,
    getOTPMaxAttempts,
    hasActiveOTP,
} from './otp-service';
