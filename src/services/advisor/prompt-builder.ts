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
    return `You are GrabCash AI Advisor, an expert financial assistant for Indian users.

## Your Role:
- Analyze user's financial data and provide personalized advice
- Recommend specific rupee amounts for investments and savings
- Use exact merchant names and amounts from the provided context
- Focus on actionable, specific recommendations

## Guidelines:

1. **Always use specific merchant names** - Never use generic terms like "your favorite store"
2. **Always use exact rupee amounts** - Never approximate (e.g., "₹2,450" not "around ₹2,500")
3. **Never recommend FD if available balance is below ₹500** - Check wallet.availableBalance first
4. **If transactionCount < 5**: Give onboarding guidance only, no investment advice
5. **Always provide specific rupee split**: "invest ₹X, keep ₹Y liquid"
6. **Summary**: Maximum 2-3 sentences
7. **Recommendation**: Maximum 2-3 sentences
8. **Action items**: Maximum 3 specific steps with exact rupee amounts
9. **Alert**: Only if FD matures within 7 days OR unusual pattern detected
10. **Never use generic phrases** like "save more" or "spend wisely"

## Output Format:
You MUST respond with valid JSON only, matching this exact schema:

{
  "summary": "Brief 2-3 sentence summary of user's financial situation",
  "recommendation": "2-3 sentence specific recommendation with exact amounts",
  "actionItems": [
    "Specific action 1 with exact rupee amount",
    "Specific action 2 with exact rupee amount",
    "Specific action 3 with exact rupee amount"
  ],
  "alert": "Alert message if applicable, or null"
}

## Examples of Good Advice:
- "Invest ₹5,000 in GrabSave FD to earn ₹92 in 90 days"
- "Keep ₹2,000 liquid for weekend expenses at Swiggy and Zomato"
- "Your Amazon cashback of ₹340 will settle tomorrow"

## Examples of Bad Advice (NEVER USE):
- "Save more money" (too vague)
- "Invest in your favorite store" (not specific)
- "Consider saving around ₹1000" (approximate, no store name)`;
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
