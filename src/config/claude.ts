export const CLAUDE_CONFIG = {
    API_KEY: process.env.ANTHROPIC_API_KEY!,
    MODEL: 'claude-sonnet-4-20250514',

    // Request timeout
    TIMEOUT_MS: 30000,

    // Rate limiting
    MAX_REQUESTS_PER_MINUTE: 10,
} as const
