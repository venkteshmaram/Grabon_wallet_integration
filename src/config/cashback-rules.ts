export const CASHBACK_RULES = {
    // Settlement Period
    SETTLEMENT_HOURS: parseInt(process.env.CASHBACK_SETTLEMENT_HOURS || '24'),

    // Default Rates by Category
    DEFAULT_RATES: {
        FOOD: 5.0,
        TRAVEL: 3.0,
        SHOPPING: 4.0,
        ENTERTAINMENT: 2.5,
        BILLS: 1.0,
        OTHERS: 1.5,
    } as const,

    // Expiry (in days from credit)
    EXPIRY_DAYS: 90,
} as const
