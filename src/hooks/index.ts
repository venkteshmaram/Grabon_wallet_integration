// ============================================
// HOOKS BARREL EXPORT
// Step 4: API Client + Custom Hooks
// ============================================

// Core wallet hooks - Step 4 Implementation
export { useWallet, type UseWalletReturn } from './use-wallet';
export { useTransactions, type UseTransactionsOptions, type UseTransactionsReturn, type TransactionFilter } from './use-transactions';
export { useFdPortfolio, type UseFdPortfolioReturn } from './use-fd-portfolio';
export { useAdvisor, type UseAdvisorReturn } from './use-advisor';
export { useAnalytics, type UseAnalyticsReturn } from './use-analytics';

// Note: Other hooks (use-auth, use-otp, use-fraud-check, etc.)
// will be implemented in subsequent steps and exported here.
// For now, import them directly from their files if needed.
