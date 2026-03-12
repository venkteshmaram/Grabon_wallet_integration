export const FD_RULES = {
    // Investment Limits
    MIN_AMOUNT: parseInt(process.env.FD_MIN_AMOUNT || '500'),
    MIN_TENURE_DAYS: parseInt(process.env.FD_MIN_TENURE_DAYS || '30'),
    MAX_TENURE_DAYS: parseInt(process.env.FD_MAX_TENURE_DAYS || '365'),

    // Interest Rate (7.5% p.a.)
    INTEREST_RATE: parseFloat(process.env.FD_INTEREST_RATE || '7.5'),

    // Early Break Conditions
    EARLY_BREAK_LOCK_DAYS: parseInt(process.env.FD_EARLY_BREAK_LOCK_DAYS || '7'),
    PREMATURE_PENALTY_PERCENT: parseFloat(process.env.FD_PREMATURE_PENALTY_PERCENT || '1'),
} as const
