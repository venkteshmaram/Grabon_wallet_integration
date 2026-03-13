import { z } from 'zod'

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1),

    // Auth
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRY: z.string().default('48h'),

    // Claude API
    ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

    // PayU
    PAYU_KEY: z.string().min(1, 'PAYU_KEY is required'),
    PAYU_SALT: z.string().min(1, 'PAYU_SALT is required'),
    PAYU_BASE_URL: z.string().url().default('https://test.payu.in/_payment'),
    PAYU_SUCCESS_URL: z.string().min(1, 'PAYU_SUCCESS_URL is required'),
    PAYU_FAILURE_URL: z.string().min(1, 'PAYU_FAILURE_URL is required'),

    // App
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    APP_URL: z.string().url().default('http://localhost:3000'),

    // Fraud Rules
    FRAUD_SPEED_THRESHOLD_SECONDS: z.string().default('90'),
    FRAUD_AMOUNT_THRESHOLD_PERCENT: z.string().default('80'),
    FRAUD_FREQUENCY_WINDOW_MINUTES: z.string().default('5'),
    FRAUD_FREQUENCY_THRESHOLD: z.string().default('3'),
    FRAUD_NEW_USER_DAYS: z.string().default('7'),
    FRAUD_NEW_USER_AMOUNT: z.string().default('2000'),
    FRAUD_NIGHT_HOUR_START: z.string().default('1'),
    FRAUD_NIGHT_HOUR_END: z.string().default('4'),
    FRAUD_NIGHT_AMOUNT: z.string().default('2000'),

    // FD Rules
    FD_MIN_AMOUNT: z.string().default('500'),
    FD_MIN_TENURE_DAYS: z.string().default('30'),
    FD_MAX_TENURE_DAYS: z.string().default('365'),
    FD_INTEREST_RATE: z.string().default('7.5'),
    FD_EARLY_BREAK_LOCK_DAYS: z.string().default('7'),
    FD_PREMATURE_PENALTY_PERCENT: z.string().default('1'),

    // Cashback
    CASHBACK_SETTLEMENT_HOURS: z.string().default('24'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:')
    parsedEnv.error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
    })
    process.exit(1)
}

export const ENV = parsedEnv.data
