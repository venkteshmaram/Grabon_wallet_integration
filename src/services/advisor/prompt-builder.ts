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
    return `You are GrabCash AI Advisor, a chill and helpful financial friend for Indian users.

## Your Tone:
- Speak like a supportive friend, not a bank manager or formal assistant.
- Use natural, conversational English (e.g., "Hey, your Zomato spends are looking a bit high...").
- Keep it punchy, direct, and "natural". Avoid long-winded explanations.

## Your Role:
- Analyze user's financial data and provide quick, personalized tips.
- Use exact merchant names and rupee amounts from the context.
- Focus on actionable, specific recommendations.

## Guidelines:
1. **Be Brief**: Limit both your 'summary' and 'recommendation' to 1-2 sentences each (maximum 3 sentences total for each field).
2. **Friendly Vibe**: Start with a casual observation or observation.
3. **Exact Data**: Use specific merchant names and exact rupee amounts (e.g., "₹2,450").
4. **Investment Lock**: Only recommend FD if balance is >= ₹500. Keep the split simple: "Invest ₹X, keep ₹Y liquid".
5. **Onboarding**: If transactionCount < 5, just give a warm welcome and a tip on how to start.
6. **No Jargon**: Avoid formal terms; use "cash" or "savings" instead of "liquidity" or "principal".

## Output Format:
You MUST respond with valid JSON only:

{
  "summary": "1-2 sentences in a friendly friend tone summarizing their wallet/spending vibe",
  "recommendation": "1-2 sentences in a friendly friend tone with a direct tip and exact amounts",
  "actionItems": [
    "Specific action 1 with amount",
    "Specific action 2 with amount",
    "Specific action 3 with amount"
  ],
  "alert": "Quick alert if needed, or null"
}

## Examples of Good (Friendly) Advice:
- Summary: "Whoa, your Swiggy game is strong this week! You've already earned ₹450 in cashback."
- Recommendation: "Why not tuck ₹3,000 into a GrabSave FD? It'll earn you ₹55 while you sleep, leaving ₹2,450 for your weekend plans."
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
    return `## Wallet State
- Available Balance: ₹${wallet.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- Pending Balance: ₹${wallet.pendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- Locked in FDs: ₹${wallet.lockedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
- Lifetime Cashback Earned: ₹${wallet.lifetimeEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * Format cashback context for prompt
 */
function formatCashbackContext(context: AdvisorContext): string {
    const { cashbackLast30Days } = context;

    if (cashbackLast30Days.length === 0) {
        return `## Cashback Last 30 Days
No cashback earned in the last 30 days.`;
    }

    const lines = cashbackLast30Days.map(
        (m) => `- ${m.merchantName}: ₹${m.totalCashback.toFixed(2)} (${m.transactionCount} transactions)`
    );

    return `## Cashback Last 30 Days
${lines.join('\n')}`;
}

/**
 * Format FD context for prompt
 */
function formatFDContext(context: AdvisorContext): string {
    const { activeFDs } = context;

    if (activeFDs.length === 0) {
        return `## Active FDs
No active Fixed Deposits.`;
    }

    const lines = activeFDs.map(
        (fd) => `- Principal: ₹${fd.principal.toFixed(2)} at ${fd.interestRate}% p.a., matures ${fd.maturityDate} (${fd.daysRemaining} days remaining), projected return: ₹${fd.projectedReturn.toFixed(2)}`
    );

    return `## Active FDs
${lines.join('\n')}`;
}

/**
 * Format spending by category context for prompt
 */
function formatSpendingContext(context: AdvisorContext): string {
    const { spendingByCategory } = context;

    if (spendingByCategory.length === 0) {
        return `## Spending by Category (Last 30 Days)
No spending recorded.`;
    }

    const lines = spendingByCategory.map(
        (c) => `- ${c.category}: ₹${c.totalSpent.toFixed(2)}`
    );

    return `## Spending by Category (Last 30 Days)
${lines.join('\n')}`;
}

/**
 * Format top merchants context for prompt
 */
function formatTopMerchantsContext(context: AdvisorContext): string {
    const { topMerchants } = context;

    if (topMerchants.length === 0) {
        return `## Top Merchants (This Month)
No merchant transactions this month.`;
    }

    const lines = topMerchants.map(
        (m) => `- ${m.merchantName}: ₹${m.cashback.toFixed(2)} cashback (${m.transactionCount} transactions)`
    );

    return `## Top Merchants (This Month)
${lines.join('\n')}`;
}

/**
 * Format day context for prompt
 */
function formatDayContext(context: AdvisorContext): string {
    const { dayContext } = context;

    return `## Day Context
- Today: ${dayContext.dayOfWeek}
- Weekend Approaching: ${dayContext.isWeekendApproaching ? 'Yes' : 'No'}
- Day of Month: ${dayContext.dayOfMonth}
- Month End: ${dayContext.isMonthEnd ? 'Yes (consider month-end expenses)' : 'No'}`;
}

/**
 * Format account context for prompt
 */
function formatAccountContext(context: AdvisorContext): string {
    const { accountAge, transactionCount, priceSensitivity } = context;

    const accountAgeYears = (accountAge / 365).toFixed(1);

    return `## Account Context
- Account Age: ${accountAge} days (${accountAgeYears} years)
- Total Transactions: ${transactionCount}
- Price Sensitivity: ${priceSensitivity.level} (${priceSensitivity.reason})`;
}

/**
 * Build user prompt from context
 * 
 * @param context - The advisor context
 * @returns Formatted user prompt
 */
export function buildUserPrompt(context: AdvisorContext): string {
    const sections = [
        formatWalletContext(context),
        formatCashbackContext(context),
        formatFDContext(context),
        formatSpendingContext(context),
        formatTopMerchantsContext(context),
        formatDayContext(context),
        formatAccountContext(context),
        '',
        '## Task',
        'Based on the above context, provide personalized financial advice.',
        '',
        'Requirements:',
        '- Use exact amounts and merchant names',
        '- Be specific and actionable',
        '- Consider weekend/month-end if applicable',
        '- Recommend FD only if balance >= ₹500',
        '- Match advice to price sensitivity level',
    ];

    return sections.join('\n');
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
