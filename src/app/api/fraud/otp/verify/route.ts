// ============================================
// OTP VERIFY API ROUTE
// POST /api/fraud/otp/verify
// Verifies a 6-digit OTP code
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP, OTPError } from '@/services/otp';

// ============================================
// REQUEST VALIDATION SCHEMA
// ============================================

const verifyOTPSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    code: z.string().length(6, 'OTP code must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
    purpose: z.enum(
        ['FRAUD_VERIFICATION', 'TRANSACTION_CONFIRMATION', 'ACCOUNT_RECOVERY', 'HIGH_VALUE_TRANSACTION'],
        { message: 'Invalid OTP purpose' }
    ),
});

type VerifyOTPRequest = z.infer<typeof verifyOTPSchema>;

// ============================================
// ERROR RESPONSE HELPER
// ============================================

function createErrorResponse(message: string, code: string, status: number = 400, extra?: Record<string, unknown>) {
    return NextResponse.json(
        {
            error: {
                message,
                code,
                ...extra,
            },
        },
        { status }
    );
}

// ============================================
// POST HANDLER - Verify OTP
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request
        const validationResult = verifyOTPSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e: { message: string }) => e.message).join(', ');
            return createErrorResponse(
                `Validation failed: ${errors}`,
                'VALIDATION_ERROR',
                400
            );
        }

        const { userId, code, purpose } = validationResult.data;

        // Verify OTP
        const result = await verifyOTP({
            userId,
            code,
            purpose,
        });

        // Return appropriate response based on result
        if (result.verified) {
            return NextResponse.json(
                {
                    success: true,
                    verified: true,
                    message: result.message,
                },
                { status: 200 }
            );
        } else {
            // Handle specific error cases
            const statusCode = result.isFrozen ? 403 : 401;
            return createErrorResponse(
                result.message,
                result.errorCode || 'VERIFICATION_FAILED',
                statusCode,
                {
                    attemptsRemaining: result.attemptsRemaining,
                    isFrozen: result.isFrozen,
                }
            );
        }
    } catch (error) {
        console.error('OTP verification error:', error);

        // Handle specific OTP errors
        if (error instanceof OTPError) {
            return createErrorResponse(error.message, error.code, 400);
        }

        // Handle generic errors
        return createErrorResponse(
            'Failed to verify OTP',
            'OTP_VERIFICATION_FAILED',
            500
        );
    }
}

// ============================================
// GET HANDLER - Documentation
// ============================================

export async function GET(): Promise<NextResponse> {
    return NextResponse.json(
        {
            message: 'OTP Verification Endpoint',
            method: 'POST',
            requiredFields: {
                userId: 'UUID of the user',
                code: '6-digit OTP code',
                purpose: 'One of: FRAUD_VERIFICATION, TRANSACTION_CONFIRMATION, ACCOUNT_RECOVERY, HIGH_VALUE_TRANSACTION',
            },
            responseSuccess: {
                verified: true,
                message: 'OTP verified successfully',
            },
            responseError: {
                verified: false,
                errorCode: 'OTP_EXPIRED | OTP_NOT_FOUND | INVALID_CODE | MAX_ATTEMPTS_EXCEEDED | ACCOUNT_FROZEN',
                message: 'Description of error',
                attemptsRemaining: 'Number (only on wrong code)',
                isFrozen: 'Boolean (true if max attempts exceeded)',
            },
        },
        { status: 200 }
    );
}
