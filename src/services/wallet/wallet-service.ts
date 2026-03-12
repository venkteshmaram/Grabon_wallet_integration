// ============================================
// WALLET SERVICE - CORE OPERATIONS
// All wallet mutation operations with atomic transactions
// ============================================

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
    ERROR_CODES,
    paisaToRupees,
} from '@/lib/constants';
import {
    WalletBalance,
    LedgerEntryResponse,
    CreditCashbackInput,
    SpendBalanceInput,
    FDLockInput,
    FDUnlockInput,
    WalletError,
    LedgerType,
    LedgerDirection,
    LedgerStatus,
} from './wallet-types';

// Transaction type alias for type safety
type TransactionClient = Prisma.TransactionClient;

// ============================================
// BALANCE OPERATIONS
// ============================================

/**
 * Fetches wallet balance for a user and converts to display format
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            throw new WalletError(
                'Wallet not found for user',
                ERROR_CODES.WALLET_NOT_FOUND
            );
        }

        return buildBalanceResponse(wallet);
    } catch (error) {
        if (error instanceof WalletError) throw error;
        throw new WalletError(
            'Failed to fetch wallet balance',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

/**
 * Builds balance response with both paisa and rupee values
 */
function buildBalanceResponse(wallet: {
    availableBalance: number;
    pendingBalance: number;
    lockedBalance: number;
    lifetimeEarned: number;
}): WalletBalance {
    const totalPaisa =
        wallet.availableBalance +
        wallet.pendingBalance +
        wallet.lockedBalance;

    return {
        availablePaisa: wallet.availableBalance,
        availableRupees: paisaToRupees(wallet.availableBalance),
        pendingPaisa: wallet.pendingBalance,
        pendingRupees: paisaToRupees(wallet.pendingBalance),
        lockedPaisa: wallet.lockedBalance,
        lockedRupees: paisaToRupees(wallet.lockedBalance),
        lifetimeEarnedPaisa: wallet.lifetimeEarned,
        lifetimeEarnedRupees: paisaToRupees(wallet.lifetimeEarned),
        totalPaisa,
        totalRupees: paisaToRupees(totalPaisa),
    };
}

// ============================================
// CASHBACK OPERATIONS
// ============================================

/**
 * Creates a pending cashback credit entry
 * Increments pending balance only - does not affect available
 */
export async function creditCashback(
    input: CreditCashbackInput
): Promise<LedgerEntryResponse> {
    validateAmount(input.amountPaisa);

    try {
        const result = await prisma.$transaction(async (tx: TransactionClient) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId: input.userId },
            });

            if (!wallet) {
                throw new WalletError(
                    'Wallet not found',
                    ERROR_CODES.WALLET_NOT_FOUND
                );
            }

            const newPendingBalance = wallet.pendingBalance + input.amountPaisa;

            const [ledgerEntry, _updatedWallet] = await Promise.all([
                tx.ledgerEntry.create({
                    data: {
                        userId: input.userId,
                        type: 'CASHBACK_CREDIT',
                        direction: 'CREDIT',
                        amount: input.amountPaisa,
                        balanceAfter: newPendingBalance,
                        status: 'PENDING',
                        merchantId: input.merchantId,
                        merchantName: input.merchantName,
                        category: input.category,
                        description: input.description,
                    },
                }),
                tx.wallet.update({
                    where: { userId: input.userId },
                    data: { pendingBalance: newPendingBalance },
                }),
            ]);

            return ledgerEntry;
        });

        return mapLedgerEntryToResponse(result);
    } catch (error) {
        if (error instanceof WalletError) throw error;
        throw new WalletError(
            'Failed to credit cashback',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

/**
 * Settles a pending cashback entry to available balance
 */
export async function settlePendingEntry(
    ledgerEntryId: string
): Promise<LedgerEntryResponse> {
    try {
        const result = await prisma.$transaction(async (tx: TransactionClient) => {
            const entry = await tx.ledgerEntry.findUnique({
                where: { id: ledgerEntryId },
            });

            if (!entry) {
                throw new WalletError(
                    'Ledger entry not found',
                    ERROR_CODES.LEDGER_ENTRY_NOT_FOUND
                );
            }

            if (entry.status !== 'PENDING') {
                throw new WalletError(
                    'Entry is not in pending status',
                    ERROR_CODES.ALREADY_SETTLED
                );
            }

            const wallet = await tx.wallet.findUnique({
                where: { userId: entry.userId },
            });

            if (!wallet) {
                throw new WalletError(
                    'Wallet not found',
                    ERROR_CODES.WALLET_NOT_FOUND
                );
            }

            const newPendingBalance = wallet.pendingBalance - entry.amount;
            const newAvailableBalance = wallet.availableBalance + entry.amount;
            const newLifetimeEarned = wallet.lifetimeEarned + entry.amount;

            const [updatedEntry, _updatedWallet] = await Promise.all([
                tx.ledgerEntry.update({
                    where: { id: ledgerEntryId },
                    data: {
                        status: 'SETTLED',
                        settledAt: new Date(),
                        balanceAfter: newAvailableBalance,
                    },
                }),
                tx.wallet.update({
                    where: { userId: entry.userId },
                    data: {
                        pendingBalance: newPendingBalance,
                        availableBalance: newAvailableBalance,
                        lifetimeEarned: newLifetimeEarned,
                    },
                }),
            ]);

            return updatedEntry;
        });

        return mapLedgerEntryToResponse(result);
    } catch (error) {
        if (error instanceof WalletError) throw error;
        throw new WalletError(
            'Failed to settle pending entry',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// SPEND OPERATIONS
// ============================================

/**
 * Deducts from available balance for a PayU spend
 */
export async function spendBalance(
    input: SpendBalanceInput
): Promise<LedgerEntryResponse> {
    validateAmount(input.amountPaisa);

    try {
        const result = await prisma.$transaction(async (tx: TransactionClient) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId: input.userId },
            });

            if (!wallet) {
                throw new WalletError(
                    'Wallet not found',
                    ERROR_CODES.WALLET_NOT_FOUND
                );
            }

            if (wallet.availableBalance < input.amountPaisa) {
                throw new WalletError(
                    'Insufficient available balance',
                    ERROR_CODES.INSUFFICIENT_BALANCE
                );
            }

            const newAvailableBalance = wallet.availableBalance - input.amountPaisa;

            const [ledgerEntry, _updatedWallet] = await Promise.all([
                tx.ledgerEntry.create({
                    data: {
                        userId: input.userId,
                        type: 'PAYU_SPEND',
                        direction: 'DEBIT',
                        amount: input.amountPaisa,
                        balanceAfter: newAvailableBalance,
                        status: 'SETTLED',
                        merchantId: input.merchantId,
                        merchantName: input.merchantName,
                        description: input.description,
                    },
                }),
                tx.wallet.update({
                    where: { userId: input.userId },
                    data: { availableBalance: newAvailableBalance },
                }),
            ]);

            return ledgerEntry;
        });

        return mapLedgerEntryToResponse(result);
    } catch (error) {
        if (error instanceof WalletError) throw error;
        throw new WalletError(
            'Failed to process spend',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// FD LOCK OPERATIONS
// ============================================

/**
 * Locks funds from available to locked when creating an FD
 */
export async function lockForFD(input: FDLockInput): Promise<LedgerEntryResponse> {
    validateAmount(input.amountPaisa);

    try {
        const result = await prisma.$transaction(async (tx: TransactionClient) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId: input.userId },
            });

            if (!wallet) {
                throw new WalletError(
                    'Wallet not found',
                    ERROR_CODES.WALLET_NOT_FOUND
                );
            }

            if (wallet.availableBalance < input.amountPaisa) {
                throw new WalletError(
                    'Insufficient available balance for FD',
                    ERROR_CODES.INSUFFICIENT_BALANCE
                );
            }

            const newAvailableBalance = wallet.availableBalance - input.amountPaisa;
            const newLockedBalance = wallet.lockedBalance + input.amountPaisa;

            const [ledgerEntry, _updatedWallet] = await Promise.all([
                tx.ledgerEntry.create({
                    data: {
                        userId: input.userId,
                        type: 'FD_LOCK',
                        direction: 'DEBIT',
                        amount: input.amountPaisa,
                        balanceAfter: newAvailableBalance,
                        status: 'SETTLED',
                        fdId: input.fdId,
                        description: `Locked for FD: ${input.fdId}`,
                    },
                }),
                tx.wallet.update({
                    where: { userId: input.userId },
                    data: {
                        availableBalance: newAvailableBalance,
                        lockedBalance: newLockedBalance,
                    },
                }),
            ]);

            return ledgerEntry;
        });

        return mapLedgerEntryToResponse(result);
    } catch (error) {
        if (error instanceof WalletError) throw error;
        throw new WalletError(
            'Failed to lock funds for FD',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

/**
 * Unlocks funds from FD back to available on maturity
 * Creates two entries: FD_UNLOCK (principal) and FD_INTEREST
 */
export async function unlockFromFD(
    input: FDUnlockInput
): Promise<{
    unlockEntry: LedgerEntryResponse;
    interestEntry: LedgerEntryResponse;
}> {
    validateAmount(input.principalPaisa);
    validateAmount(input.interestPaisa);

    try {
        const result = await prisma.$transaction(async (tx: TransactionClient) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId: input.userId },
            });

            if (!wallet) {
                throw new WalletError(
                    'Wallet not found',
                    ERROR_CODES.WALLET_NOT_FOUND
                );
            }

            if (wallet.lockedBalance < input.principalPaisa) {
                throw new WalletError(
                    'Locked balance less than principal',
                    ERROR_CODES.INSUFFICIENT_BALANCE
                );
            }

            const totalReturn = input.principalPaisa + input.interestPaisa;
            const newLockedBalance = wallet.lockedBalance - input.principalPaisa;
            const newAvailableBalance = wallet.availableBalance + totalReturn;
            const newLifetimeEarned = wallet.lifetimeEarned + input.interestPaisa;

            const [unlockEntry, interestEntry, _updatedWallet] = await Promise.all([
                tx.ledgerEntry.create({
                    data: {
                        userId: input.userId,
                        type: 'FD_UNLOCK',
                        direction: 'CREDIT',
                        amount: input.principalPaisa,
                        balanceAfter: newAvailableBalance - input.interestPaisa,
                        status: 'SETTLED',
                        fdId: input.fdId,
                        description: `FD principal unlocked: ${input.fdId}`,
                    },
                }),
                tx.ledgerEntry.create({
                    data: {
                        userId: input.userId,
                        type: 'FD_INTEREST',
                        direction: 'CREDIT',
                        amount: input.interestPaisa,
                        balanceAfter: newAvailableBalance,
                        status: 'SETTLED',
                        fdId: input.fdId,
                        description: `FD interest earned: ${input.fdId}`,
                    },
                }),
                tx.wallet.update({
                    where: { userId: input.userId },
                    data: {
                        lockedBalance: newLockedBalance,
                        availableBalance: newAvailableBalance,
                        lifetimeEarned: newLifetimeEarned,
                    },
                }),
            ]);

            return { unlockEntry, interestEntry };
        });

        return {
            unlockEntry: mapLedgerEntryToResponse(result.unlockEntry),
            interestEntry: mapLedgerEntryToResponse(result.interestEntry),
        };
    } catch (error) {
        if (error instanceof WalletError) throw error;
        throw new WalletError(
            'Failed to unlock FD funds',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// FRAUD HOLD OPERATIONS
// ============================================

/**
 * Marks a ledger entry as HELD for fraud review
 */
export async function holdForFraud(
    _userId: string,
    ledgerEntryId: string,
    flagReason: string
): Promise<LedgerEntryResponse> {
    try {
        const updated = await prisma.ledgerEntry.update({
            where: { id: ledgerEntryId },
            data: {
                status: 'HELD',
                isFlagged: true,
                flagReason,
            },
        });

        return mapLedgerEntryToResponse(updated);
    } catch (error) {
        throw new WalletError(
            'Failed to hold entry for fraud review',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

/**
 * Releases a fraud hold and processes the original spend
 */
export async function releaseFromFraudHold(
    userId: string,
    ledgerEntryId: string
): Promise<LedgerEntryResponse> {
    try {
        const result = await prisma.$transaction(async (tx: TransactionClient) => {
            const entry = await tx.ledgerEntry.findUnique({
                where: { id: ledgerEntryId },
            });

            if (!entry) {
                throw new WalletError(
                    'Ledger entry not found',
                    ERROR_CODES.LEDGER_ENTRY_NOT_FOUND
                );
            }

            if (entry.status !== 'HELD') {
                throw new WalletError(
                    'Entry is not held',
                    ERROR_CODES.INVALID_STATUS_TRANSITION
                );
            }

            const wallet = await tx.wallet.findUnique({
                where: { userId },
            });

            if (!wallet) {
                throw new WalletError(
                    'Wallet not found',
                    ERROR_CODES.WALLET_NOT_FOUND
                );
            }

            if (wallet.availableBalance < entry.amount) {
                throw new WalletError(
                    'Insufficient balance after hold release',
                    ERROR_CODES.INSUFFICIENT_BALANCE
                );
            }

            const newAvailableBalance = wallet.availableBalance - entry.amount;

            const [updatedEntry, _updatedWallet] = await Promise.all([
                tx.ledgerEntry.update({
                    where: { id: ledgerEntryId },
                    data: {
                        status: 'SETTLED',
                        isFlagged: false,
                        flagReason: null,
                        balanceAfter: newAvailableBalance,
                        settledAt: new Date(),
                    },
                }),
                tx.wallet.update({
                    where: { userId },
                    data: { availableBalance: newAvailableBalance },
                }),
            ]);

            return updatedEntry;
        });

        return mapLedgerEntryToResponse(result);
    } catch (error) {
        if (error instanceof WalletError) throw error;
        throw new WalletError(
            'Failed to release fraud hold',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates that amount is positive
 */
function validateAmount(amount: number): void {
    if (!amount || amount <= 0) {
        throw new WalletError(
            'Amount must be greater than zero',
            ERROR_CODES.INVALID_AMOUNT
        );
    }
}

/**
 * Maps Prisma LedgerEntry to response format
 */
function mapLedgerEntryToResponse(entry: {
    id: string;
    type: string;
    direction: string;
    amount: number;
    balanceAfter: number;
    status: string;
    merchantId: string | null;
    merchantName: string | null;
    category: string | null;
    description: string | null;
    isFlagged: boolean;
    flagReason: string | null;
    createdAt: Date;
    settledAt: Date | null;
}): LedgerEntryResponse {
    return {
        id: entry.id,
        type: entry.type as LedgerType,
        direction: entry.direction as LedgerDirection,
        amountPaisa: entry.amount,
        amountRupees: paisaToRupees(entry.amount),
        balanceAfterPaisa: entry.balanceAfter,
        balanceAfterRupees: paisaToRupees(entry.balanceAfter),
        status: entry.status as LedgerStatus,
        merchantId: entry.merchantId,
        merchantName: entry.merchantName,
        category: entry.category,
        description: entry.description,
        isFlagged: entry.isFlagged,
        flagReason: entry.flagReason,
        createdAt: entry.createdAt,
        settledAt: entry.settledAt,
        statusBadge: getStatusBadge(entry.status, entry.isFlagged),
    };
}

/**
 * Gets status badge configuration for UI display
 */
function getStatusBadge(
    status: string,
    isFlagged: boolean
): { label: string; color: 'green' | 'yellow' | 'red' | 'blue' | 'gray' } {
    if (isFlagged) {
        return { label: 'Flagged', color: 'red' };
    }

    switch (status) {
        case 'SETTLED':
            return { label: 'Completed', color: 'green' };
        case 'PENDING':
            return { label: 'Pending', color: 'yellow' };
        case 'HELD':
            return { label: 'On Hold', color: 'red' };
        case 'CANCELLED':
            return { label: 'Cancelled', color: 'gray' };
        default:
            return { label: status, color: 'gray' };
    }
}
