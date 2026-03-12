export const FRAUD_RULES = {
    // Speed Rule: Spend within N seconds of credit
    SPEED_THRESHOLD_SECONDS: parseInt(process.env.FRAUD_SPEED_THRESHOLD_SECONDS || '90'),

    // Whitelist Override: Same merchant 3+ times in last 5 debits
    WHITELIST_MIN_MATCHES: 3,
    WHITELIST_LOOKBACK_COUNT: 5,

    // Amount Rule: Transaction exceeds X% of available balance
    AMOUNT_THRESHOLD_PERCENT: parseInt(process.env.FRAUD_AMOUNT_THRESHOLD_PERCENT || '80'),

    // Frequency Rule: Multiple transactions in short window
    FREQUENCY_WINDOW_MINUTES: parseInt(process.env.FRAUD_FREQUENCY_WINDOW_MINUTES || '5'),
    FREQUENCY_THRESHOLD: parseInt(process.env.FRAUD_FREQUENCY_THRESHOLD || '3'),

    // New User Rule: Large spend on new account
    NEW_USER_DAYS: parseInt(process.env.FRAUD_NEW_USER_DAYS || '7'),
    NEW_USER_AMOUNT: parseInt(process.env.FRAUD_NEW_USER_AMOUNT || '2000'),

    // Night Rule: High-value transaction in quiet hours
    NIGHT_HOUR_START: parseInt(process.env.FRAUD_NIGHT_HOUR_START || '1'),
    NIGHT_HOUR_END: parseInt(process.env.FRAUD_NIGHT_HOUR_END || '4'),
    NIGHT_AMOUNT: parseInt(process.env.FRAUD_NIGHT_AMOUNT || '2000'),
} as const
