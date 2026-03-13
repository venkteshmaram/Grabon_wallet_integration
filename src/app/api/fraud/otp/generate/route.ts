// ============================================
// OTP GENERATE API ROUTE
// POST /api/fraud/otp/generate
// Generates a 6-digit OTP and returns it directly (displayed in UI)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateOTP, OTPError, VALID_OTP_PURPOSES } from '@/services/otp';

// ============================================
// REQUEST VALIDATION SCHEMA
// ============================================

const generateOTPSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    purpose: z.enum(
        ['FRAUD_VERIFICATION', 'TRANSACTION_CONFIRMATION', 'ACCOUNT_RECOVERY', 'HIGH_VALUE_TRANSACTION']
    ).default('FRAUD_VERIFICATION'),
});

type GenerateOTPRequest = z.infer<typeof generateOTPSchema>;

// ============================================
// ERROR RESPONSE HELPER
// ============================================

function createErrorResponse(message: string, code: string, status: number = 400) {
    return NextResponse.json(
        {
            error: {
                message,
                code,
            },
        },
        { status }
    );
}

// ============================================
// POST HANDLER - Generate OTP
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        let body;
        try {
            body = await request.json();
            console.log('[OTP_GENERATE] Request body:', JSON.stringify(body));
        } catch (e) {
            console.error('[OTP_GENERATE] Failed to parse JSON body');
            return createErrorResponse('Invalid JSON body', 'INVALID_JSON', 400);
        }

        // Validate request
        const validationResult = generateOTPSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e: { message: string }) => e.message).join(', ');
            console.error('[OTP_GENERATE] Validation failed:', JSON.stringify(validationResult.error.format()));
            return createErrorResponse(
                `Validation failed: ${errors}`,
                'VALIDATION_ERROR',
                400
            );
        }

        const { userId, purpose } = validationResult.data;

        // Generate OTP
        const result = await generateOTP({
            userId,
            purpose,
        });

        // Return OTP directly (displayed in UI - no SMS/WhatsApp)
        return NextResponse.json(
            {
                success: true,
                otpCode: result.otpCode,
                expiresAt: result.expiresAt,
                purpose: result.purpose,
                otpId: result.otpId,
                message: 'OTP generated successfully. Display this code to the user.',
                displayInstructions: 'Show this 6-digit code on the OTP screen. Do not send via SMS/WhatsApp.',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('OTP generation error:', error);

        // Handle specific OTP errors
        if (error instanceof OTPError) {
            return createErrorResponse(error.message, error.code, 400);
        }

        // Handle generic errors
        return createErrorResponse(
            'Failed to generate OTP',
            'OTP_GENERATION_FAILED',
            500
        );
    }
}

// ============================================
// GET HANDLER - Get valid purposes
// ============================================

export async function GET(): Promise<NextResponse> {
    return NextResponse.json(
        {
            validPurposes: VALID_OTP_PURPOSES,
            message: 'Valid OTP purposes for the generate endpoint',
        },
        { status: 200 }
    );
}
