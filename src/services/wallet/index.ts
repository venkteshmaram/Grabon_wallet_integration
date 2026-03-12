// ============================================
// WALLET SERVICE - PUBLIC API
// Export all wallet and ledger operations
// ============================================

// Types
export type {
    WalletBalance,
    LedgerEntryResponse,
    LedgerFilters,
    LedgerType,
    LedgerDirection,
    LedgerStatus,
    WalletAnalytics,
    CategoryBreakdown,
    MonthlyTrend,
    TopMerchant,
    CreditCashbackInput,
    SpendBalanceInput,
    FDLockInput,
    FDUnlockInput,
    PendingEntry,
    ServiceError,
} from './wallet-types';

// Classes
export { WalletError } from './wallet-types';

// Wallet operations
export {
    getWalletBalance,
    creditCashback,
    settlePendingEntry,
    spendBalance,
    lockForFD,
    unlockFromFD,
    holdForFraud,
    releaseFromFraudHold,
} from './wallet-service';

// Ledger operations
export {
    getLedgerEntries,
    getWalletAnalytics,
    getPendingEntriesOlderThan,
} from './ledger-service';
