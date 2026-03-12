// ============================================
// FRAUD ENGINE - PUBLIC API
// Export all fraud detection operations
// ============================================

// Types
export type {
    FraudContext,
    FraudCheckResult,
    CheckTransactionInput,
    RuleResult,
    SpeedRuleResult,
    WhitelistRuleResult,
    AmountRuleResult,
    FrequencyRuleResult,
    NewUserRuleResult,
    NightRuleResult,
    DebitEntry,
    CreditEntry,
    FraudAction,
    FraudRuleName,
    FraudReason,
} from './fraud-types';

// Constants and Classes
export {
    FRAUD_ERROR_CODES,
    FRAUD_RULES,
    FRAUD_REASONS,
    FraudError,
} from './fraud-types';

// Main fraud engine
export { checkTransaction, buildFraudContext } from './fraud-engine';

// Individual rules (exported for testing)
export { checkSpeedRule } from './rules/speed-rule';
export { checkWhitelistRule } from './rules/whitelist-rule';
export { checkAmountRule } from './rules/amount-rule';
export { checkFrequencyRule } from './rules/frequency-rule';
export { checkNewUserRule } from './rules/new-user-rule';
export { checkNightRule } from './rules/night-rule';
