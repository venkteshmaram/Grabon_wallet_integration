// ============================================
// OTP TEST ROUTE
// GET /api/test-otp
// Tests the complete OTP service functionality
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import {
    generateOTP,
    verifyOTP,
    getOTPExpiryMinutes,
    getOTPMaxAttempts,
    hasActiveOTP,
} from '@/services/otp';
import { OTPPurpose } from '@/services/otp/otp-types';
import { prisma } from '@/lib/prisma';

// ============================================
// TEST RESULT TYPES
// ============================================

interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
    details?: unknown;
}

// ============================================
// MAIN TEST HANDLER
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
    const results: TestResult[] = [];
    let overallStatus: 'PASS' | 'FAIL' = 'PASS';
    let generatedOTPCode: string = '';
    let testUserId: string = '';
    const testPurpose: OTPPurpose = 'FRAUD_VERIFICATION';

    try {
        // ============================================
        // TEST 1: Get a test user
        // ============================================
        try {
            const firstUser = await prisma.user.findFirst({
                select: { id: true, name: true },
            });

            if (firstUser) {
                testUserId = firstUser.id;
                results.push({
                    name: 'User Lookup',
                    status: 'PASS',
                    message: `Found test user: ${firstUser.name}`,
                    details: { userId: testUserId },
                });
            } else {
                results.push({
                    name: 'User Lookup',
                    status: 'FAIL',
                    message: 'No users found in database',
                });
                overallStatus = 'FAIL';
            }
        } catch (error) {
            overallStatus = 'FAIL';
            results.push({
                name: 'User Lookup',
                status: 'FAIL',
                message: error instanceof Error ? error.message : 'User lookup failed',
            });
        }

        // Skip remaining tests if no user found
        if (!testUserId) {
            throw new Error('No test user available');
        }

        // ============================================
        // TEST 2: Get OTP Configuration
        // ============================================
        try {
            const expiryMinutes = getOTPExpiryMinutes();
            const maxAttempts = getOTPMaxAttempts();

            if (expiryMinutes === 5 && maxAttempts === 3) {
                results.push({
                    name: 'OTP Configuration',
                    status: 'PASS',
                    message: 'OTP configuration correct',
                    details: { expiryMinutes, maxAttempts },
                });
            } else {
                throw new Error('Configuration mismatch');
            }
        } catch (error) {
            overallStatus = 'FAIL';
            results.push({
                name: 'OTP Configuration',
                status: 'FAIL',
                message: error instanceof Error ? error.message : 'Configuration test failed',
            });
        }

        // ============================================
        // TEST 3: Generate OTP
        // ============================================
        try {
            const result = await generateOTP({
                userId: testUserId,
                purpose: testPurpose,
            });

            generatedOTPCode = result.otpCode;

            // Validate OTP format
            if (
                result.otpCode.length === 6 &&
                /^\d{6}$/.test(result.otpCode) &&
                result.purpose === testPurpose
            ) {
                results.push({
                    name: 'OTP Generation',
                    status: 'PASS',
                    message: 'OTP generated successfully',
                    details: {
                        otpId: result.otpId,
                        otpCode: result.otpCode, // Showing in test for verification
                        expiresAt: result.expiresAt,
                    },
                });
            } else {
                throw new Error('Invalid OTP format');
            }
        } catch (error) {
            overallStatus = 'FAIL';
            results.push({
                name: 'OTP Generation',
                status: 'FAIL',
                message: error instanceof Error ? error.message : 'OTP generation failed',
            });
        }

        // ============================================
        // TEST 4: Check Active OTP
        // ============================================
        try {
            const hasActive = await hasActiveOTP(testUserId, testPurpose);

            if (hasActive) {
                results.push({
                    name: 'Active OTP Check',
                    status: 'PASS',
                    message: 'Active OTP detected for user',
                });
            } else {
                throw new Error('Active OTP not found after generation');
            }
        } catch (error) {
            overallStatus = 'FAIL';
            results.push({
                name: 'Active OTP Check',
                status: 'FAIL',
                message: error instanceof Error ? error.message : 'Active OTP check failed',
            });
        }

        // ============================================
        // TEST 5: Verify OTP with Wrong Code
        // ============================================
        try {
            const wrongResult = await verifyOTP({
                userId: testUserId,
                code: '000000', // Wrong code
                purpose: testPurpose,
            });

            if (!wrongResult.verified && wrongResult.attemptsRemaining === 2) {
                results.push({
                    name: 'Wrong OTP Verification',
                    status: 'PASS',
                    message: 'Wrong code correctly rejected with attempts remaining',
                    details: {
                        attemptsRemaining: wrongResult.attemptsRemaining,
                    },
                });
            } else {
                throw new Error('Wrong OTP handling incorrect');
            }
        } catch (error) {
            overallStatus = 'FAIL';
            results.push({
                name: 'Wrong OTP Verification',
                status: 'FAIL',
                message: error instanceof Error ? error.message : 'Wrong OTP test failed',
            });
        }

        // ============================================
        // TEST 6: Verify OTP with Correct Code
        // ============================================
        try {
            const correctResult = await verifyOTP({
                userId: testUserId,
                code: generatedOTPCode,
                purpose: testPurpose,
            });

            if (correctResult.verified) {
                results.push({
                    name: 'Correct OTP Verification',
                    status: 'PASS',
                    message: 'Correct OTP verified successfully',
                });
            } else {
                throw new Error(`Correct OTP failed: ${correctResult.message}`);
            }
        } catch (error) {
            overallStatus = 'FAIL';
            results.push({
                name: 'Correct OTP Verification',
                status: 'FAIL',
                message: error instanceof Error ? error.message : 'Correct OTP test failed',
            });
        }

        // ============================================
        // TEST 7: Verify Used OTP (should fail)
        // ============================================
        try {
            const usedResult = await verifyOTP({
                userId: testUserId,
                code: generatedOTPCode,
                purpose: testPurpose,
            });

            if (!usedResult.verified) {
                results.push({
                    name: 'Used OTP Rejection',
                    status: 'PASS',
                    message: 'Used OTP correctly rejected',
                    details: { errorCode: usedResult.errorCode },
                });
            } else {
                throw new Error('Used OTP should have been rejected');
            }
        } catch (error) {
            overallStatus = 'FAIL';
            results.push({
                name: 'Used OTP Rejection',
                status: 'FAIL',
                message: error instanceof Error ? error.message : 'Used OTP test failed',
            });
        }

        // ============================================
        // TEST 8: Generate New OTP and Test Max Attempts
        // ============================================
        try {
            const newOTP = await generateOTP({
                userId: testUserId,
                purpose: testPurpose,
            });

            let frozenResult = null;

            // Try wrong codes up to 3 times
            for (let i = 0; i < 3; i++) {
                const result = await verifyOTP({
                    userId: testUserId,
                    code: '111111',
                    purpose: testPurpose,
                });

                // Capture the result if account is frozen
                if (result.isFrozen) {
                    frozenResult = result;
                    break;
                }
            }

            // Check if account was frozen on 3rd attempt
            if (frozenResult && frozenResult.isFrozen) {
                results.push({
                    name: 'Max Attempts Freeze',
                    status: 'PASS',
                    message: 'Account frozen after max attempts',
                    details: { errorCode: frozenResult.errorCode },
                });
            } else {
                throw new Error('Account should be frozen after 3 failed attempts');
            }
        } catch (error) {
            overallStatus = 'FAIL';
            results.push({
                name: 'Max Attempts Freeze',
                status: 'FAIL',
                message: error instanceof Error ? error.message : 'Max attempts test failed',
            });
        }

    } catch (error) {
        overallStatus = 'FAIL';
        results.push({
            name: 'Test Suite',
            status: 'FAIL',
            message: error instanceof Error ? error.message : 'Test suite failed',
        });
    }

    // ============================================
    // RETURN RESULTS
    // ============================================
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const skipCount = results.filter(r => r.status === 'SKIP').length;

    return NextResponse.json({
        status: overallStatus,
        summary: {
            total: results.length,
            passed: passCount,
            failed: failCount,
            skipped: skipCount,
        },
        tests: results,
        timestamp: new Date().toISOString(),
        documentation: {
            endpoints: {
                generate: 'POST /api/fraud/otp/generate',
                verify: 'POST /api/fraud/otp/verify',
            },
            flow: [
                '1. Transaction flagged by fraud engine',
                '2. Call /api/fraud/otp/generate to get OTP',
                '3. Display OTP code on screen (no SMS/WhatsApp)',
                '4. User enters OTP on verification screen',
                '5. Call /api/fraud/otp/verify to validate',
                '6. If verified, proceed with transaction',
                '7. If 3 wrong attempts, account is frozen',
            ],
            rules: {
                expiry: '5 minutes',
                maxAttempts: 3,
                delivery: 'Displayed in UI only - no external messaging',
            },
        },
    }, {
        status: overallStatus === 'PASS' ? 200 : 500,
    });
}
