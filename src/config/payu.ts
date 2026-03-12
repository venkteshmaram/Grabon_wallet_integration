export const PAYU_CONFIG = {
    KEY: process.env.PAYU_KEY!,
    SALT: process.env.PAYU_SALT!,
    BASE_URL: process.env.PAYU_BASE_URL || 'https://test.payu.in/_payment',
    SUCCESS_URL: process.env.PAYU_SUCCESS_URL!,
    FAILURE_URL: process.env.PAYU_FAILURE_URL!,

    // Test card details (for reference)
    TEST_CARD: {
        NUMBER: '5123456789012346',
        EXPIRY: '05/25',
        CVV: '123',
        OTP: '123456',
    },
} as const
