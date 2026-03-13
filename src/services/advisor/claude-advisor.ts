// ============================================
// CLAUDE ADVISOR - Calls Anthropic API for financial advice
// Step 15: Claude Advisor Service - Production Grade
// ============================================

import { buildAdvisorContext, type AdvisorContext } from './context-builder';
import { buildPrompt } from './prompt-builder';

// ============================================
// TYPES
// ============================================

interface ClaudeResponse {
    summary: string;
    recommendation: string;
    actionItems: string[];
    alert: string | null;
}

interface AdvisorResult {
    summary: string;
    recommendation: string;
    actionItems: string[];
    alert: string | null;
    contextUsed: string;
}

// ============================================
// ANTHROPIC API CONFIGURATION
// ============================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 1024;

// ============================================
// API CALL FUNCTION
// ============================================

/**
 * Call Anthropic API
 * 
 * @param systemPrompt - System prompt for Claude
 * @param userPrompt - User prompt with context
 * @returns Parsed JSON response
 */
async function callAnthropicAPI(
    systemPrompt: string,
    userPrompt: string
): Promise<ClaudeResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable not set');
    }

    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
            'Anthropic-Version': '2023-06-01',
        },
        body: JSON.stringify({
            model: ANTHROPIC_MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract content from response
    const content = data.content?.[0]?.text;

    if (!content) {
        throw new Error('Empty response from Anthropic API');
    }

    // Parse JSON response (handle markdown code blocks)
    try {
        // Strip markdown code blocks if present
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
            jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonContent.trim());

        // Validate required fields
        if (!parsed.summary || !parsed.recommendation || !Array.isArray(parsed.actionItems)) {
            throw new Error('Invalid response structure from Claude');
        }

        return {
            summary: parsed.summary,
            recommendation: parsed.recommendation,
            actionItems: parsed.actionItems,
            alert: parsed.alert || null,
        };
    } catch (parseError) {
        console.error('Failed to parse Claude response:', content);
        throw new Error('Failed to parse AI response');
    }
}

// ============================================
// FALLBACK GENERATOR
// ============================================

/**
 * Generate fallback recommendation when API fails
 * 
 * @param context - Advisor context
 * @returns Fallback recommendation
 */
function generateFallbackRecommendation(context: AdvisorContext): AdvisorResult {
    const { wallet, activeFDs, dayContext, transactionCount } = context;

    // Build summary
    const summary = `Based on your wallet activity, you have earned ₹${wallet.lifetimeEarned.toFixed(2)} in total cashback. Your current available balance is ₹${wallet.availableBalance.toFixed(2)}.`;

    // Build recommendation based on balance
    let recommendation = '';
    const actionItems: string[] = [];
    let alert: string | null = null;

    if (transactionCount < 5) {
        recommendation = 'Welcome to GrabCash! Start making purchases at our partner merchants to earn cashback that you can invest.';
        actionItems.push('Make your first purchase at Amazon or Flipkart to earn cashback');
        actionItems.push('Set up your payment preferences for faster checkout');
    } else if (wallet.availableBalance >= 500) {
        const investAmount = Math.floor(wallet.availableBalance / 1000) * 1000;
        const interest = Math.round(investAmount * 0.075 * 90 / 365);
        recommendation = `Consider investing ₹${investAmount.toLocaleString('en-IN')} in a 90-day GrabSave FD at 7.5% p.a. to earn ₹${interest.toLocaleString('en-IN')} in interest.`;
        actionItems.push(`Invest ₹${investAmount.toLocaleString('en-IN')} in GrabSave FD for 90 days`);
        actionItems.push('Review your spending patterns weekly');
    } else if (wallet.availableBalance > 100) {
        recommendation = 'Your balance is growing. Continue using GrabCash at partner merchants to earn more cashback for investment.';
        actionItems.push('Use GrabCash checkout for your next purchase');
        actionItems.push('Check out merchants with highest cashback rates');
    } else {
        recommendation = 'Start your savings journey by making purchases through GrabCash to earn cashback.';
        actionItems.push('Explore partner merchants with cashback offers');
        actionItems.push('Make your first purchase to start earning');
    }

    // Add generic action items
    actionItems.push('Enable notifications for cashback settlement');

    // Check for alerts
    const fdMaturingSoon = activeFDs.find((fd: { daysRemaining: number }) => fd.daysRemaining <= 7);
    if (fdMaturingSoon) {
        alert = `Your FD of ₹${fdMaturingSoon.principal.toFixed(2)} is maturing in ${fdMaturingSoon.daysRemaining} days.`;
    }

    if (wallet.pendingBalance > 0) {
        alert = `Your cashback settlement of ₹${wallet.pendingBalance.toFixed(2)} is pending.`;
    }

    return {
        summary,
        recommendation,
        actionItems: actionItems.slice(0, 3),
        alert,
        contextUsed: JSON.stringify({ source: 'fallback', timestamp: new Date().toISOString() }),
    };
}

// ============================================
// MAIN CLAUDE ADVISOR FUNCTION
// ============================================

/**
 * Generate personalized financial advice using Claude AI
 * 
 * @param userId - The user ID to generate advice for
 * @returns Advisor result with recommendation
 */
export async function generateAdvice(userId: string): Promise<AdvisorResult> {
    try {
        // Step 1: Build context
        const context = await buildAdvisorContext(userId);

        // Step 2: Build prompts
        const { system, user } = buildPrompt(context);

        // Step 3: Check if Anthropic API key is configured
        if (!process.env.ANTHROPIC_API_KEY) {
            console.log('Anthropic API key not configured, using fallback');
            return generateFallbackRecommendation(context);
        }

        // Step 4: Call Anthropic API
        const claudeResponse = await callAnthropicAPI(system, user);

        // Step 5: Return result
        return {
            summary: claudeResponse.summary,
            recommendation: claudeResponse.recommendation,
            actionItems: claudeResponse.actionItems.slice(0, 3),
            alert: claudeResponse.alert,
            contextUsed: JSON.stringify({
                timestamp: new Date().toISOString(),
                walletBalance: context.wallet.availableBalance,
                activeFDs: context.activeFDs.length,
                transactionCount: context.transactionCount,
            }),
        };
    } catch (error) {
        console.error('Claude advisor error:', error);

        // Fallback to local generation
        const context = await buildAdvisorContext(userId);
        return generateFallbackRecommendation(context);
    }
}

// ============================================
// EXPORTS
// ============================================

export type { AdvisorResult, ClaudeResponse };
