// ============================================
// PROMPT BUILDER - Constructs system and user prompts for Claude AI
// Step 15: Claude Advisor Service - Production Grade
// ============================================

import type { AdvisorContext } from './context-builder';

// ============================================
// SYSTEM PROMPT
// ============================================

/**
 * Build system prompt for Claude AI
 * 
 * Instructs Claude on how to generate financial advice
 */
export function buildSystemPrompt(): string {
    return `You are GrabCash AI Advisor, a chill financial buddy. 

## Your Tone:
- Talk like a supportive friend - casual, energetic, and helpful.
- No banker talk. No jargon. Use simple words.
- Keep it super punchy. 

## Guidelines:
1. **Ultra Brief**: Summary = 1 short sentence. Recommendation = 1 short sentence. 
2. **Natural**: Start with "Yo", "Hey", or "Nice!".
3. **Action Focused**: Give one specific tip based on the balance.
4. **Data Privacy**: Only mention 1 specific merchant if they spent a lot there recently. 

## Output Format:
JSON ONLY:
{
  "summary": "1 very short casual sentence summary",
  "recommendation": "1 very short casual tip with amounts",
  "actionItems": ["Action 1", "Action 2"],
  "alert": "Quick alert or null"
}
`;
}

// ============================================
// USER PROMPT
// ============================================

/**
 * Format wallet context for prompt
 */
function formatWalletContext(context: AdvisorContext): string {
    const { wallet } = context;
    return `## Wallet
- Cash: ₹${wallet.availableBalance.toFixed(0)}
- Pending: ₹${wallet.pendingBalance.toFixed(0)}
- Total Earned: ₹${wallet.lifetimeEarned.toFixed(0)}`;
}

/**
 * Format cashback context for prompt
 */
function formatCashbackContext(context: AdvisorContext): string {
    const { cashbackLast30Days } = context;

    if (cashbackLast30Days.length === 0) return "";

    const top = cashbackLast30Days[0];
    return `## Recent Win
- Top Merchant: ${top.merchantName} (earned ₹${top.totalCashback.toFixed(0)})`;
}

/**
 * Format FD context for prompt
 */
function formatFDContext(context: AdvisorContext): string {
    const { activeFDs } = context;
    if (activeFDs.length === 0) return "";
    return `## FDs
- Count: ${activeFDs.length} active`;
}

/**
 * Format spending by category context for prompt
 */
function formatSpendingContext(context: AdvisorContext): string {
    const { spendingByCategory } = context;
    if (spendingByCategory.length === 0) return "";
    const top = spendingByCategory[0];
    return `## Main Spend
- ${top.category}: ₹${top.totalSpent.toFixed(0)}`;
}

/**
 * Format top merchants context for prompt
 */
function formatTopMerchantsContext(context: AdvisorContext): string {
    const { topMerchants } = context;
    if (topMerchants.length === 0) return "";
    return `## Fave Merchant: ${topMerchants[0].merchantName}`;
}

/**
 * Format day context for prompt
 */
function formatDayContext(context: AdvisorContext): string {
    const { dayContext } = context;
    return `## Timing: ${dayContext.dayOfWeek}${dayContext.isWeekendApproaching ? " (Weekend soon!)" : ""}${dayContext.isMonthEnd ? " (Month end!)" : ""}`;
}

/**
 * Build user prompt from context
 */
export function buildUserPrompt(context: AdvisorContext): string {
    const sections = [
        formatWalletContext(context),
        formatCashbackContext(context),
        formatFDContext(context),
        formatSpendingContext(context),
        formatTopMerchantsContext(context),
        formatDayContext(context),
        '',
        'Task: Give 1 sentence of friendly vibes and 1 sentence of actual advice. Keep it under 20 words total if possible.',
    ];

    return sections.filter(s => s !== "").join('\n');
}

// ============================================
// COMBINED PROMPT BUILDER
// ============================================

/**
 * Build complete prompt for Claude AI
 * 
 * @param context - The advisor context
 * @returns Object with system and user prompts
 */
export function buildPrompt(context: AdvisorContext): {
    system: string;
    user: string;
} {
    return {
        system: buildSystemPrompt(),
        user: buildUserPrompt(context),
    };
}
