// ============================================
// FD SERVICE - LIFECYCLE OPERATIONS
// Fixed Deposit creation, retrieval, break, and maturity
// ============================================

import { prisma } from '@/lib/prisma';
// @ts-ignore
import type { Prisma } from '@prisma/client';
import { FD_PREMATURE_PENALTY_PERCENT, paisaToRupees } from '@/lib/constants';
import { lockForFD, unlockFromFD } from '@/services/wallet';
import { ERROR_CODES } from '@/lib/constants';
import {
    FDRecordResponse,
    FDPortfolioSummary,
    CreateFDInput,
    FDDueForMaturity,
    FDError,
    FD_ERROR_CODES,
} from './fd-types';
import {
    calculateMaturityAmount,
    calculateInterestEarned,
    calculateAccruedInterest,
    calculateEarlyBreakReturn,
    validateFDInput,
    validateAmount,
    calculateMaturityDate,
    calculateDaysRemaining,
    calculateProgressPercentage,
    calculateMaturityDetails,
} from './fd-calculator';

// Transaction type alias for type safety
// @ts-ignore
type TransactionClient = any;

// ============================================
// FD CREATION
// ============================================

/**
 * Creates a new Fixed Deposit
 * Validates input, checks balance, locks funds, creates FD record
 */
export async function createFD(
    input: CreateFDInput
): Promise<FDRecordResponse> {
    // Validate amount is positive
    const amountValidation = validateAmount(input.principalPaisa);
    if (!amountValidation.valid) {
        throw new FDError(
            amountValidation.error || 'Invalid amount',
            amountValidation.code || FD_ERROR_CODES.BELOW_MINIMUM_AMOUNT
        );
    }

    // Validate FD input (minimum amount, tenure range)
    const inputValidation = validateFDInput(
        input.principalPaisa,
        input.tenureDays
    );
    if (!inputValidation.valid) {
        throw new FDError(
            inputValidation.error || 'Invalid input',
            inputValidation.code || FD_ERROR_CODES.INVALID_TENURE
        );
    }

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // Calculate all maturity details
            const maturityDetails = calculateMaturityDetails(
                input.principalPaisa,
                input.tenureDays
            );

            // Lock funds in wallet first (this validates sufficient balance)
            const lockEntry = await lockForFD({
                userId: input.userId,
                amountPaisa: input.principalPaisa,
                fdId: 'pending', // Will update after FD creation
            }, tx);

            // Create FD record
            const fdRecord = await tx.fDRecord.create({
                data: {
                    userId: input.userId,
                    principal: input.principalPaisa,
                    interestRate: maturityDetails.interestRate,
                    tenureDays: input.tenureDays,
                    maturityAmount: maturityDetails.maturityAmountPaisa,
                    interestEarned: maturityDetails.interestEarnedPaisa,
                    startDate: maturityDetails.startDate,
                    maturityDate: maturityDetails.maturityDate,
                    status: 'ACTIVE',
                },
            });

            // Update the ledger entry with the actual FD ID
            await tx.ledgerEntry.update({
                where: { id: lockEntry.id },
                data: { fdId: fdRecord.id },
            });

            return { fdRecord, lockEntry };
        });

        // Return FD with computed fields
        return mapFDRecordToResponse(result.fdRecord);
    } catch (error) {
        if (error instanceof FDError) throw error;
        
        // Handle WalletError specially to preserve the message
        if (error && typeof error === 'object' && 'code' in error) {
            const err = error as any;
            if (err.code === ERROR_CODES.INSUFFICIENT_BALANCE || (err.message && err.message.includes('Insufficient'))) {
                throw new FDError(
                    err.message || 'Insufficient available balance for FD',
                    FD_ERROR_CODES.INSUFFICIENT_BALANCE
                );
            }
        }

        throw new FDError(
            error instanceof Error ? error.message : 'Failed to create FD',
            ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// FD RETRIEVAL
// ============================================

/**
 * Gets a single FD by ID with ownership verification
 */
export async function getFDById(
    fdId: string,
    userId: string
): Promise<FDRecordResponse> {
    try {
        const fd = await prisma.fDRecord.findUnique({
            where: { id: fdId },
        });

        if (!fd) {
            throw new FDError('FD not found', FD_ERROR_CODES.FD_NOT_FOUND);
        }

        // Security check: verify FD belongs to requesting user
        if (fd.userId !== userId) {
            throw new FDError(
                'Unauthorized access to FD',
                FD_ERROR_CODES.UNAUTHORIZED_ACCESS
            );
        }

        return mapFDRecordToResponse(fd);
    } catch (error) {
        if (error instanceof FDError) throw error;
        throw new FDError(
            'Failed to fetch FD',
            FD_ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

/**
 * Gets all FDs for a user with portfolio summary
 */
export async function getUserFDs(userId: string): Promise<FDPortfolioSummary> {
    try {
        const fds = await prisma.fDRecord.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        const mappedFDs = fds.map(mapFDRecordToResponse);

        // Calculate portfolio totals
        const activeFDs = mappedFDs.filter((fd: any) => fd.status === 'ACTIVE');
        const totalPortfolioValue = activeFDs.reduce(
            (sum: number, fd: any) => sum + fd.maturityAmountPaisa,
            0
        );
        const totalLocked = activeFDs.reduce(
            (sum: number, fd: any) => sum + fd.principalPaisa,
            0
        );
        const totalAccruedInterest = activeFDs.reduce(
            (sum: number, fd: any) => sum + fd.accruedInterestPaisa,
            0
        );

        return {
            fds: mappedFDs,
            totalActiveFDs: activeFDs.length,
            totalPortfolioValuePaisa: totalPortfolioValue,
            totalPortfolioValueRupees: paisaToRupees(totalPortfolioValue),
            totalLockedPaisa: totalLocked,
            totalLockedRupees: paisaToRupees(totalLocked),
            totalAccruedInterestPaisa: totalAccruedInterest,
            totalAccruedInterestRupees: paisaToRupees(totalAccruedInterest),
        };
    } catch (error) {
        if (error instanceof FDError) throw error;
        throw new FDError(
            'Failed to fetch user FDs',
            FD_ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// FD BREAK (PREMATURE WITHDRAWAL)
// ============================================

/**
 * Breaks an FD early with penalty
 */
export async function breakFDEarly(
    fdId: string,
    userId: string
): Promise<FDRecordResponse> {
    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // Fetch FD with lock
            const fd = await tx.fDRecord.findUnique({
                where: { id: fdId },
            });

            if (!fd) {
                throw new FDError('FD not found', FD_ERROR_CODES.FD_NOT_FOUND);
            }

            // Verify ownership
            if (fd.userId !== userId) {
                throw new FDError(
                    'Unauthorized access to FD',
                    FD_ERROR_CODES.UNAUTHORIZED_ACCESS
                );
            }

            // Check FD is active
            if (fd.status !== 'ACTIVE') {
                throw new FDError(
                    'FD is not active',
                    FD_ERROR_CODES.FD_NOT_ACTIVE
                );
            }

            // Calculate early break details
            const breakDetails = calculateEarlyBreakReturn(
                fd.principal,
                fd.interestRate,
                fd.startDate
            );

            // Check lock period
            if (!breakDetails.canBreak) {
                throw new FDError(
                    `Cannot break FD within first ${breakDetails.lockDaysRemaining} days`,
                    FD_ERROR_CODES.FD_LOCK_PERIOD_ACTIVE
                );
            }

            // Unlock funds from FD (returns principal + accrued interest - penalty)
            const unlockResult = await unlockFromFD({
                userId,
                principalPaisa: fd.principal,
                interestPaisa: breakDetails.accruedInterestPaisa,
                fdId,
            });

            // Create penalty ledger entry if there's a penalty
            if (breakDetails.penaltyPaisa > 0) {
                await tx.ledgerEntry.create({
                    data: {
                        userId,
                        type: 'FD_PENALTY',
                        direction: 'DEBIT',
                        amount: breakDetails.penaltyPaisa,
                        balanceAfter: 0, // Will be updated by unlockFromFD logic
                        status: 'SETTLED',
                        fdId,
                        description: `Early break penalty for FD: ${fdId}`,
                    },
                });
            }

            // Update FD record
            const updatedFD = await tx.fDRecord.update({
                where: { id: fdId },
                data: {
                    status: 'BROKEN',
                    brokenAt: new Date(),
                    penaltyAmount: breakDetails.penaltyPaisa,
                    actualReturn: breakDetails.actualReturnPaisa,
                },
            });

            return { updatedFD, breakDetails, unlockResult };
        });

        return mapFDRecordToResponse(result.updatedFD);
    } catch (error) {
        if (error instanceof FDError) throw error;
        throw new FDError(
            'Failed to break FD',
            FD_ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// FD MATURITY
// ============================================

/**
 * Matures an FD (called by cron job)
 */
export async function matureFD(fdId: string): Promise<FDRecordResponse> {
    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // Fetch FD
            const fd = await tx.fDRecord.findUnique({
                where: { id: fdId },
            });

            if (!fd) {
                throw new FDError('FD not found', FD_ERROR_CODES.FD_NOT_FOUND);
            }

            // Only mature active FDs (idempotent)
            if (fd.status !== 'ACTIVE') {
                throw new FDError(
                    'FD is not active',
                    FD_ERROR_CODES.FD_NOT_ACTIVE
                );
            }

            // Unlock full principal + interest
            await unlockFromFD({
                userId: fd.userId,
                principalPaisa: fd.principal,
                interestPaisa: fd.interestEarned,
                fdId,
            });

            // Update FD status
            const updatedFD = await tx.fDRecord.update({
                where: { id: fdId },
                data: {
                    status: 'MATURED',
                },
            });

            return updatedFD;
        });

        return mapFDRecordToResponse(result);
    } catch (error) {
        if (error instanceof FDError) throw error;
        throw new FDError(
            'Failed to mature FD',
            FD_ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// CRON JOB QUERIES
// ============================================

/**
 * Gets FDs due for maturity (used by cron job)
 */
export async function getFDsDueForMaturity(): Promise<FDDueForMaturity[]> {
    try {
        const fds = await prisma.fDRecord.findMany({
            where: {
                status: 'ACTIVE',
                maturityDate: {
                    lte: new Date(),
                },
            },
            select: {
                id: true,
                userId: true,
                principal: true,
                interestEarned: true,
                maturityDate: true,
            },
        });

        return fds.map((fd: any) => ({
            id: fd.id,
            userId: fd.userId,
            principalPaisa: fd.principal,
            interestEarnedPaisa: fd.interestEarned,
            maturityDate: fd.maturityDate,
        }));
    } catch (error) {
        throw new FDError(
            'Failed to fetch FDs due for maturity',
            FD_ERROR_CODES.TRANSACTION_FAILED
        );
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Maps Prisma FDRecord to response format with computed fields
 */
function mapFDRecordToResponse(fd: {
    id: string;
    userId: string;
    principal: number;
    interestRate: number;
    tenureDays: number;
    maturityAmount: number;
    interestEarned: number;
    startDate: Date;
    maturityDate: Date;
    status: string;
    brokenAt: Date | null;
    penaltyAmount: number | null;
    actualReturn: number | null;
    createdAt: Date;
    updatedAt: Date;
}): FDRecordResponse {
    // Calculate live computed fields
    const accruedInterestPaisa =
        fd.status === 'ACTIVE'
            ? calculateAccruedInterest(
                fd.principal,
                fd.interestRate,
                fd.startDate
            )
            : 0;

    const daysRemaining = calculateDaysRemaining(fd.maturityDate);
    const progressPercentage = calculateProgressPercentage(
        fd.startDate,
        fd.tenureDays
    );

    return {
        id: fd.id,
        userId: fd.userId,
        principalPaisa: fd.principal,
        principalRupees: paisaToRupees(fd.principal),
        interestRate: fd.interestRate,
        tenureDays: fd.tenureDays,
        maturityAmountPaisa: fd.maturityAmount,
        maturityAmountRupees: paisaToRupees(fd.maturityAmount),
        interestEarnedPaisa: fd.interestEarned,
        interestEarnedRupees: paisaToRupees(fd.interestEarned),
        startDate: fd.startDate,
        maturityDate: fd.maturityDate,
        status: fd.status as 'ACTIVE' | 'MATURED' | 'BROKEN',
        accruedInterestPaisa,
        accruedInterestRupees: paisaToRupees(accruedInterestPaisa),
        daysRemaining,
        progressPercentage,
        brokenAt: fd.brokenAt,
        penaltyAmountPaisa: fd.penaltyAmount,
        penaltyAmountRupees: fd.penaltyAmount
            ? paisaToRupees(fd.penaltyAmount)
            : null,
        actualReturnPaisa: fd.actualReturn,
        actualReturnRupees: fd.actualReturn
            ? paisaToRupees(fd.actualReturn)
            : null,
        createdAt: fd.createdAt,
        updatedAt: fd.updatedAt,
    };
}
